import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from '@playwright/test';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

const TOTAL_SLIDES = 86;
const sourceUrl = process.env.SOURCE_DECK_URL || 'http://localhost:8787/index.html';
const sourceDirectory = process.env.SOURCE_DECK_DIR || '/tmp/academy-wave-next/classroom-slides';
const portUrl = process.env.DECK_URL || 'http://localhost:5178/deck';
const output = process.env.PARITY_OUTPUT || '/tmp/aetherlink-deck-parity';
const pixelThreshold = Number(process.env.PARITY_PIXEL_THRESHOLD ?? '0.1');
const fixedEpoch = Number(process.env.PARITY_FIXED_EPOCH ?? Date.parse('2025-01-01T12:00:00Z'));
const viewports = [
  {name: 'desktop', width: 1440, height: 900},
  {name: 'tablet', width: 1024, height: 768},
  {name: 'mobile', width: 390, height: 844},
];

function parseSlides(value) {
  if (!value?.trim()) return Array.from({length: TOTAL_SLIDES}, (_, index) => index + 1);
  const result = new Set();
  for (const part of value.split(',')) {
    const [startText, endText] = part.trim().split('-');
    const start = Number(startText);
    const end = endText === undefined ? start : Number(endText);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > TOTAL_SLIDES) {
      throw new Error(`Invalid PARITY_SLIDES item: ${part}`);
    }
    for (let slide = start; slide <= end; slide += 1) result.add(slide);
  }
  return [...result].sort((left, right) => left - right);
}

function gitValue(args, cwd) {
  try {
    return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
  } catch {
    return null;
  }
}

function provenance() {
  const appRoot = gitValue(['rev-parse', '--show-toplevel'], process.cwd());
  const sourceRoot = gitValue(['-C', sourceDirectory, 'rev-parse', '--show-toplevel']);
  const diff = appRoot ? gitValue(['diff', 'HEAD', '--binary'], appRoot) ?? '' : '';
  const status = appRoot ? gitValue(['status', '--short'], appRoot) ?? '' : '';
  const untrackedContent = appRoot ? (() => {
    try {
      const paths = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], {cwd: appRoot}).toString('utf8').split('\0').filter(Boolean);
      return paths.map((relativePath) => `${relativePath}\n${readFileSync(join(appRoot, relativePath))}`).join('\n');
    } catch { return ''; }
  })() : '';
  return {
    sourceDirectory,
    sourceGitSHA: sourceRoot ? gitValue(['rev-parse', 'HEAD'], sourceRoot) : null,
    appHEAD: appRoot ? gitValue(['rev-parse', 'HEAD'], appRoot) : null,
    appDirtyHash: createHash('sha256').update(`${diff}\n${status}\n${untrackedContent}`).digest('hex'),
    appDirtyFiles: status ? status.split('\n') : [],
  };
}

async function installClock(page) {
  await page.clock.install({time: fixedEpoch - 1000});
  await page.clock.pauseAt(fixedEpoch);
}

function trackFailures(page) {
  const failures = [];
  const assetTypes = new Set(['document', 'font', 'image', 'stylesheet', 'script']);
  page.on('requestfailed', (request) => {
    if (assetTypes.has(request.resourceType())) failures.push({kind: 'request', url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText ?? 'request failed'});
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && assetTypes.has(response.request().resourceType())) failures.push({kind: 'response', url: response.url(), resourceType: response.request().resourceType(), status: response.status()});
  });
  return failures;
}

async function assertReady(page, side, failures) {
  const assets = await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    return {
      fontStatus: document.fonts.status,
      brokenImages: images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    };
  });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    void (document.querySelector('.academy-deck') ?? document.body).getBoundingClientRect().height;
  });
  const assetFailures = [...failures];
  if (assets.fontStatus !== 'loaded') assetFailures.push({kind: 'font', status: assets.fontStatus});
  for (const src of assets.brokenImages) assetFailures.push({kind: 'image', url: src, error: 'not decoded'});
  if (assetFailures.length) throw new Error(`${side} has failed assets: ${JSON.stringify(assetFailures)}`);
  return assets;
}

async function advanceAndSettle(source, port) {
  await Promise.all([
    source.clock.runFor(2000),
    port.clock.runFor(2000),
  ]);
  await Promise.all([source.waitForTimeout(120), port.waitForTimeout(120)]);
}

async function waitForFiniteAnimations(page) {
  await page.waitForFunction(() => [...document.getAnimations()].filter((animation) => {
    const timing = animation.effect?.getComputedTiming();
    return timing?.iterations !== Infinity;
  }).every((animation) => animation.playState === 'finished'), undefined, {timeout: 10000});
}

async function waitForStableLayout(page) {
  let previous = '';
  let stableSamples = 0;
  for (let attempt = 0; attempt < 12 && stableSamples < 2; attempt += 1) {
    const current = await page.evaluate(() => {
      const elements = [document.querySelector('#stage'), ...document.querySelectorAll('#stage > *, #stage *')];
      return JSON.stringify(elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return [element.tagName, element.className, Math.round(rect.x * 100) / 100, Math.round(rect.y * 100) / 100, Math.round(rect.width * 100) / 100, Math.round(rect.height * 100) / 100, style.display, style.visibility, style.opacity, style.fontFamily, style.fontSize, style.lineHeight];
      }));
    });
    stableSamples = current === previous ? stableSamples + 1 : 0;
    previous = current;
    if (stableSamples < 2) await page.waitForTimeout(40);
  }
  if (stableSamples < 2) throw new Error('layout did not settle after assets and clock advancement');
}

async function target(page, side, slide) {
  await page.locator('#stage h1').first().waitFor({state: 'visible'});
  const title = (await page.locator('#stage h1').first().textContent() ?? '').trim();
  const count = (await page.locator('#count').textContent() ?? '').trim();
  const countIndex = Number(count.split('/')[0].trim()) - 1;
  const expectedIndex = slide - 1;
  const dataIndex = side === 'source' ? countIndex : Number(await page.locator('.academy-deck').getAttribute('data-index'));
  const valid = dataIndex === expectedIndex && countIndex === expectedIndex && count.endsWith(`/ ${TOTAL_SLIDES}`) && title.length > 0;
  if (!valid) throw new Error(`${side} target mismatch: expected slide ${slide}, got index ${dataIndex}, count ${count}, title ${JSON.stringify(title)}`);
  return {title, index: dataIndex, count};
}

function comparePng(sourceBuffer, portBuffer) {
  const sourcePng = PNG.sync.read(sourceBuffer);
  const portPng = PNG.sync.read(portBuffer);
  const sameDimensions = sourcePng.width === portPng.width && sourcePng.height === portPng.height;
  if (!sameDimensions) {
    const diff = new PNG({width: Math.max(sourcePng.width, portPng.width), height: Math.max(sourcePng.height, portPng.height)});
    for (let x = 0; x < diff.width; x += 1) {
      for (let y = 0; y < diff.height; y += 1) {
        if (x < 3 || y < 3 || x >= diff.width - 3 || y >= diff.height - 3) {
          const offset = (y * diff.width + x) * 4;
          diff.data[offset] = 255;
          diff.data[offset + 3] = 255;
        }
      }
    }
    return {sourcePng, portPng, sameDimensions, differentPixels: null, comparedPixels: 0, diff};
  }
  const diff = new PNG({width: sourcePng.width, height: sourcePng.height});
  const differentPixels = pixelmatch(sourcePng.data, portPng.data, diff.data, sourcePng.width, sourcePng.height, {threshold: pixelThreshold});
  return {sourcePng, portPng, sameDimensions, differentPixels, comparedPixels: sourcePng.width * sourcePng.height, diff};
}

async function saveFailureArtifacts(caseOutput, sourceBuffer, portBuffer, diff) {
  const sourcePath = join(caseOutput, 'source.png');
  const portPath = join(caseOutput, 'port.png');
  const diffPath = join(caseOutput, 'diff.png');
  await mkdir(caseOutput, {recursive: true});
  await Promise.all([writeFile(sourcePath, sourceBuffer), writeFile(portPath, portBuffer)]);
  if (diff) await writeFile(diffPath, PNG.sync.write(diff));
  return {source: sourcePath, port: portPath, diff: diff ? diffPath : null};
}

const slides = parseSlides(process.env.PARITY_SLIDES);
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true});
const report = [];
try {
  for (const viewport of viewports) {
    for (const slide of slides) {
      const source = await browser.newPage({viewport, deviceScaleFactor: 1, reducedMotion: 'reduce'});
      const port = await browser.newPage({viewport, deviceScaleFactor: 1, reducedMotion: 'reduce'});
      const sourceFailures = trackFailures(source);
      const portFailures = trackFailures(port);
      await Promise.all([installClock(source), installClock(port)]);
      sourceFailures.length = 0;
      portFailures.length = 0;
      const caseOutput = join(output, `${viewport.name}-slide-${String(slide).padStart(2, '0')}`);
      let item = {viewport: viewport.name, slide, threshold: pixelThreshold, fixedEpoch, sourceTitle: null, portTitle: null, titleMismatch: false, geometryMismatch: false, differentPixels: null, comparedPixels: 0, passed: false, failures: []};
      try {
        await Promise.all([
          source.goto(`${sourceUrl}#${slide}`, {waitUntil: 'domcontentloaded'}),
          port.goto(`${portUrl}?index=${slide - 1}`, {waitUntil: 'domcontentloaded'}),
        ]);
        const [sourceTarget, portTarget] = await Promise.all([target(source, 'source', slide), target(port, 'port', slide)]);
        item = {...item, sourceTitle: sourceTarget.title, portTitle: portTarget.title, titleMismatch: sourceTarget.title !== portTarget.title};
        await Promise.all([assertReady(source, 'source', sourceFailures), assertReady(port, 'port', portFailures)]);
        await Promise.all([source.clock.runFor(32), port.clock.runFor(32)]);
        await advanceAndSettle(source, port);
        await Promise.all([waitForFiniteAnimations(source), waitForFiniteAnimations(port)]);
        await Promise.all([source.waitForTimeout(120), port.waitForTimeout(120)]);
        await Promise.all([assertReady(source, 'source', sourceFailures), assertReady(port, 'port', portFailures)]);
        await Promise.all([source.clock.runFor(32), port.clock.runFor(32)]);
        await Promise.all([waitForStableLayout(source), waitForStableLayout(port)]);
        const [sourceBuffer, portBuffer] = await Promise.all([source.screenshot({fullPage: true}), port.screenshot({fullPage: true})]);
        const comparison = comparePng(sourceBuffer, portBuffer);
        item = {...item, source: [comparison.sourcePng.width, comparison.sourcePng.height], port: [comparison.portPng.width, comparison.portPng.height], geometryMismatch: !comparison.sameDimensions, differentPixels: comparison.differentPixels, comparedPixels: comparison.comparedPixels};
        const failed = item.titleMismatch || item.geometryMismatch || (item.differentPixels ?? 1) > 0;
        if (failed) item.artifacts = await saveFailureArtifacts(caseOutput, sourceBuffer, portBuffer, comparison.diff);
        item.passed = !failed;
      } catch (error) {
        item.failures = [error instanceof Error ? error.message : String(error), ...sourceFailures, ...portFailures];
        try {
          const [sourceBuffer, portBuffer] = await Promise.all([source.screenshot({fullPage: true}), port.screenshot({fullPage: true})]);
          const comparison = comparePng(sourceBuffer, portBuffer);
          item = {...item, source: [comparison.sourcePng.width, comparison.sourcePng.height], port: [comparison.portPng.width, comparison.portPng.height], geometryMismatch: !comparison.sameDimensions, differentPixels: comparison.differentPixels, comparedPixels: comparison.comparedPixels, artifacts: await saveFailureArtifacts(caseOutput, sourceBuffer, portBuffer, comparison.diff)};
        } catch (artifactError) {
          item.failures.push(`could not capture failure artifacts: ${artifactError instanceof Error ? artifactError.message : String(artifactError)}`);
        }
      }
      report.push(item);
      await Promise.all([source.close(), port.close()]);
    }
  }
} finally {
  await browser.close();
}

const result = {
  ...provenance(),
  generatedAt: new Date().toISOString(),
  sourceUrl,
  portUrl,
  output,
  slides,
  viewports,
  cases: report.length,
  threshold: pixelThreshold,
  fixedEpoch,
  report,
};
await writeFile(join(output, 'report.json'), JSON.stringify(result, null, 2));
const failures = report.filter((item) => !item.passed);
console.log(JSON.stringify({output, cases: report.length, mismatches: failures.length, exactMatches: report.length - failures.length, threshold: pixelThreshold, slides}));
if (failures.length) process.exitCode = 1;
