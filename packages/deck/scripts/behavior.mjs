import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from '@playwright/test';

const sourceUrl = process.env.SOURCE_DECK_URL || 'http://localhost:8787/index.html';
const sourceDirectory = process.env.SOURCE_DECK_DIR || '/tmp/academy-wave-next/classroom-slides';
const portUrl = process.env.DECK_URL || 'http://localhost:5178/deck';
const output = process.env.BEHAVIOR_OUTPUT || '/tmp/aetherlink-deck-behavior';
const fixedEpoch = Number(process.env.PARITY_FIXED_EPOCH ?? Date.parse('2025-01-01T12:00:00Z'));

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
  };
}

async function installClock(page) {
  await page.clock.install({time: fixedEpoch});
}

async function assetsReady(page) {
  const assets = await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    return {
      fontStatus: document.fonts.status,
      brokenImages: images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    };
  });
  if (assets.fontStatus !== 'loaded' || assets.brokenImages.length) throw new Error(`asset readiness failed: ${JSON.stringify(assets)}`);
}

async function waitProjector(page, url) {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  await page.locator('#stage').waitFor();
  await assetsReady(page);
}

async function mountControlledFixture(page) {
  await page.evaluate(async () => {
    const old = [...document.querySelectorAll('.academy-deck')].map((element) => ({element, hidden: element.hasAttribute('hidden')}));
    old.forEach(({element}) => element.setAttribute('hidden', ''));
    const container = document.createElement('div');
    container.dataset.controlledFixture = 'true';
    container.style.cssText = 'position:absolute;left:-10000px;top:0;width:1440px;min-height:900px;';
    document.body.append(container);
    const module = await import('/src/deck/controlled-fixture.tsx');
    const controls = module.mount(container);
    window.__deckControlledFixture = {container, controls, old};
  });
  const fixture = page.locator('[data-controlled-fixture]');
  await fixture.locator('.academy-deck').waitFor();
  return fixture;
}

async function fixtureCommand(page, command, value) {
  await page.evaluate(({command, value}) => {
    const fixture = window.__deckControlledFixture;
    if (!fixture) throw new Error('controlled fixture is not mounted');
    if (command === 'setSlides') fixture.controls.setSlides(value);
    else if (command === 'setIndex') fixture.controls.setIndex(value);
    else if (command === 'setRevealStep') fixture.controls.setRevealStep(value);
    else if (command === 'setMode') fixture.controls.setMode(value);
    else if (command === 'reset') fixture.controls.reset();
    else throw new Error(`unknown fixture command: ${command}`);
  }, {command, value});
  await page.waitForTimeout(40);
}

async function unmountControlledFixture(page) {
  await page.evaluate(() => {
    const fixture = window.__deckControlledFixture;
    if (!fixture) return;
    fixture.controls.unmount();
    fixture.container.remove();
    fixture.old.forEach(({element, hidden}) => { if (!hidden) element.removeAttribute('hidden'); });
    delete window.__deckControlledFixture;
  });
}

async function countIndex(page, side) {
  if (side === 'source') return Number((await page.locator('#count').textContent() ?? '').split('/')[0].trim()) - 1;
  return Number(await page.locator('.academy-deck').getAttribute('data-index'));
}

async function activeRevealIndices(fixture) {
  return fixture.locator('.reveal-grid > .card:not(.closed)').evaluateAll((cards) => cards.map((card) => {
    const value = card.getAttribute('style')?.match(/--i:\s*(\d+)/)?.[1];
    return value === undefined ? -1 : Number(value);
  }));
}

async function check(checks, name, fn) {
  try {
    const details = await fn();
    checks.push({name, pass: true, details: details ?? null});
  } catch (error) {
    checks.push({name, pass: false, details: error instanceof Error ? error.message : String(error)});
  }
}

const browser = await chromium.launch({headless: true});
const source = await browser.newPage({reducedMotion: 'reduce'});
const port = await browser.newPage({reducedMotion: 'reduce'});
await installClock(source);
await installClock(port);
const checks = [];
const fixtureDiagnostics = [];
let planBReferenceText = '';
port.on('pageerror', (error) => fixtureDiagnostics.push({kind: 'pageerror', text: error.message}));
port.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'warning' || message.type() === 'error' || (/^Warning:/i.test(text) && message.type() === 'debug')) fixtureDiagnostics.push({kind: `console:${message.type()}`, text});
});
const controlledPropCoverage = {sameTreeIndexChanges: false, sameTreeRevealStepChanges: false, sameTreeSlidesEmptyToPopulated: false, sameTreeModeChanges: false, sameTreeInstances: false};

try {
  await check(checks, 'source has all 86 progress segments', async () => {
    await waitProjector(source, `${sourceUrl}#1`);
    const count = await source.locator('#progress .seg').count();
    if (count !== 86) throw new Error(`found ${count}`);
    return {count};
  });
  await check(checks, 'port has all 86 progress segments', async () => {
    await waitProjector(port, `${portUrl}?index=0`);
    const count = await port.locator('#progress .seg').count();
    if (count !== 86) throw new Error(`found ${count}`);
    return {count};
  });

  await check(checks, 'source arrow reveals before advancing', async () => {
    await waitProjector(source, `${sourceUrl}#16`);
    const before = await source.locator('.card.closed').count();
    await source.keyboard.press('ArrowRight');
    await source.waitForTimeout(80);
    const after = await source.locator('.card.closed').count();
    if (await countIndex(source, 'source') !== 15 || before === 0 || after >= before) throw new Error(`index=${await countIndex(source, 'source')} closed=${before}->${after}`);
    return {closedBefore: before, closedAfter: after};
  });
  await check(checks, 'port arrow reveals before advancing', async () => {
    await waitProjector(port, `${portUrl}?index=15`);
    const before = await port.locator('.card.closed').count();
    await port.keyboard.press('ArrowRight');
    await port.waitForTimeout(80);
    const after = await port.locator('.card.closed').count();
    if (await countIndex(port, 'port') !== 15 || before === 0 || after >= before) throw new Error(`index=${await countIndex(port, 'port')} closed=${before}->${after}`);
    return {closedBefore: before, closedAfter: after};
  });

  await check(checks, 'source S opens presenter route', async () => {
    await waitProjector(source, `${sourceUrl}#1`);
    const popupPromise = source.waitForEvent('popup', {timeout: 3000});
    await source.keyboard.press('s');
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    const url = popup.url();
    await popup.close();
    if (!url) throw new Error('presenter popup had no URL');
    return {url};
  });
  await check(checks, 'port S and P open presenter dialog', async () => {
    await waitProjector(port, `${portUrl}?index=0`);
    await port.keyboard.press('s');
    if (!(await port.locator('.presenter-dialog').count())) throw new Error('S did not open presenter dialog');
    await port.keyboard.press('Escape');
    await port.keyboard.press('p');
    if (!(await port.locator('.presenter-dialog').count())) throw new Error('P did not open presenter dialog');
    return {dialog: true};
  });

  await check(checks, 'source B toggles Plan B overlay', async () => {
    await waitProjector(source, `${sourceUrl}#78`);
    const before = await source.locator('.planb.show').count();
    await source.keyboard.press('b');
    const after = await source.locator('.planb.show').count();
    planBReferenceText = (await source.locator('.planb.show').textContent() ?? '').trim();
    if (before !== 0 || after !== 1 || !planBReferenceText) throw new Error(`visible=${before}->${after}, textLength=${planBReferenceText.length}`);
    return {visibleBefore: before, visibleAfter: after, textLength: planBReferenceText.length};
  });
  await check(checks, 'port B toggles Plan B overlay', async () => {
    await waitProjector(port, `${portUrl}?index=77`);
    const before = await port.locator('.planb.show').count();
    await port.keyboard.press('b');
    const after = await port.locator('.planb.show').count();
    const portText = (await port.locator('.planb.show').textContent() ?? '').trim();
    if (before !== 0 || after !== 1 || portText !== planBReferenceText) throw new Error(`visible=${before}->${after}, sourceText=${planBReferenceText.length}, portText=${portText.length}`);
    return {visibleBefore: before, visibleAfter: after, textLength: portText.length};
  });

  await check(checks, 'port exercise timer advances after Start', async () => {
    await waitProjector(port, `${portUrl}?index=34`);
    const timer = port.locator('.timer');
    const start = timer.getByRole('button', {name: /^Start/});
    const before = await timer.locator('.timer-face').textContent();
    await start.click();
    await port.clock.runFor(1200);
    const after = await timer.locator('.timer-face').textContent();
    if (before === after) throw new Error(`timer stayed at ${before}`);
    return {before, after};
  });

  await check(checks, 'reader hides facilitator notes', async () => {
    await port.goto(`${portUrl}?index=14&mode=presenter`, {waitUntil: 'domcontentloaded'});
    await port.locator('.deck-presenter-tools').waitFor();
    const notes = await port.locator('.deck-presenter-tools').textContent();
    const expectedNote = 'Keep this slide brief';
    await port.goto(`${portUrl}?index=14&mode=reader`, {waitUntil: 'domcontentloaded'});
    await port.locator('.reader-lesson').waitFor();
    const body = await port.locator('body').textContent();
    if (!notes?.includes(expectedNote) || body?.includes(expectedNote) || (await port.locator('.deck-presenter-tools').count()) !== 0) throw new Error('reader note privacy assertion failed');
    return {presenterNotesFound: true, readerNotesFound: false, readerPresenterTools: 0};
  });
  await check(checks, 'follow mode hides facilitator notes', async () => {
    await waitProjector(port, `${portUrl}?index=14&mode=follow`);
    const body = await port.locator('body').textContent();
    if ((await port.locator('.deck-presenter-tools').count()) !== 0 || body?.includes('Facilitator notes') || body?.includes('Keep this slide brief')) throw new Error('follow exposed facilitator notes');
    return {presenterTools: 0};
  });

  await check(checks, 'route slide navigation cleans old visual state', async () => {
    await waitProjector(port, `${portUrl}?index=15`);
    if ((await port.locator('.reveal-grid').count()) === 0) throw new Error('fixture slide did not mount reveal grid');
    await port.locator('#progress .seg').nth(68).click();
    await port.waitForTimeout(80);
    if (await countIndex(port, 'port') !== 68 || (await port.locator('.reveal-grid').count()) !== 0 || (await port.locator('.planb.show').count()) !== 0) throw new Error(`index=${await countIndex(port, 'port')} stale visual state remains`);
    return {index: 68, revealGrid: 0, visiblePlanB: 0};
  });
  await check(checks, 'route rewind resets reveal state after leaving slide', async () => {
    await waitProjector(port, `${portUrl}?index=15`);
    const initialClosed = await port.locator('.card.closed').count();
    await port.keyboard.press('ArrowRight');
    const revealedClosed = await port.locator('.card.closed').count();
    await port.keyboard.press('ArrowLeft');
    await port.keyboard.press('ArrowRight');
    await port.waitForTimeout(80);
    const rewindClosed = await port.locator('.card.closed').count();
    if (initialClosed === 0 || revealedClosed >= initialClosed || rewindClosed !== initialClosed || await countIndex(port, 'port') !== 15) throw new Error(`closed=${initialClosed}->${revealedClosed}->${rewindClosed}, index=${await countIndex(port, 'port')}`);
    return {initialClosed, revealedClosed, rewindClosed, index: 15};
  });
  await check(checks, 'route visual mount changes from slide without reveal to reveal slide', async () => {
    await waitProjector(port, `${portUrl}?index=0`);
    if ((await port.locator('.reveal-grid').count()) !== 0) throw new Error('empty fixture already had reveal grid');
    await port.locator('#progress .seg').nth(15).click();
    await port.waitForTimeout(80);
    const closed = await port.locator('.card.closed').count();
    if (await countIndex(port, 'port') !== 15 || (await port.locator('.reveal-grid').count()) !== 1 || closed === 0) throw new Error(`index=${await countIndex(port, 'port')} revealGrid=${await port.locator('.reveal-grid').count()} closed=${closed}`);
    return {index: 15, revealGrid: 1, closed};
  });
  await check(checks, 'route mode remount replaces projector with reader and back', async () => {
    await waitProjector(port, `${portUrl}?index=15&mode=presenter`);
    const presenterTitle = (await port.locator('#stage h1').textContent() ?? '').trim();
    await port.goto(`${portUrl}?index=15&mode=reader`, {waitUntil: 'domcontentloaded'});
    await port.locator('.reader-lesson').waitFor();
    if ((await port.locator('#stage h1').count()) !== 0 || (await port.locator('.deck-presenter-tools').count()) !== 0) throw new Error('reader retained projector/presenter DOM');
    await port.goto(`${portUrl}?index=15`, {waitUntil: 'domcontentloaded'});
    await port.locator('#stage h1').waitFor();
    const projectorTitle = (await port.locator('#stage h1').textContent() ?? '').trim();
    if (projectorTitle !== presenterTitle || (await port.locator('.reader-lesson').count()) !== 0) throw new Error(`title=${projectorTitle}, reader=${await port.locator('.reader-lesson').count()}`);
    return {presenterTitle, projectorTitle, readerHeadingCount: 0};
  });
  await check(checks, 'independent browser pages do not share slide index', async () => {
    const peer = await browser.newPage({reducedMotion: 'reduce'});
    await installClock(peer);
    try {
      await Promise.all([waitProjector(port, `${portUrl}?index=0`), waitProjector(peer, `${portUrl}?index=0`)]);
      await port.locator('#progress .seg').nth(15).click();
      await port.waitForTimeout(80);
      const active = await countIndex(port, 'port');
      const peerActive = await countIndex(peer, 'port');
      if (active !== 15 || peerActive !== 0) throw new Error(`active=${active}, peer=${peerActive}`);
      return {active, peerActive};
    } finally {
      await peer.close();
    }
  });
  await check(checks, 'fixture controlled slides empty-to-populated transition', async () => {
    fixtureDiagnostics.length = 0;
    const fixture = await mountControlledFixture(port);
    try {
      await fixtureCommand(port, 'setSlides', []);
      if ((await fixture.locator('.academy-deck').count()) !== 0) throw new Error('empty slides did not render empty Deck output');
      await fixtureCommand(port, 'reset');
      await fixture.locator('.academy-deck').waitFor();
      if (await fixture.locator('.academy-deck').getAttribute('data-index') !== '0') throw new Error('populated fixture did not restore index 0');
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics: ${JSON.stringify(fixtureDiagnostics)}`);
      controlledPropCoverage.sameTreeSlidesEmptyToPopulated = true;
      return {emptyDeckCount: 0, populatedIndex: 0};
    } finally {
      await unmountControlledFixture(port);
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics after unmount: ${JSON.stringify(fixtureDiagnostics)}`);
    }
  });
  await check(checks, 'fixture controlled index transition stays on same component', async () => {
    fixtureDiagnostics.length = 0;
    const fixture = await mountControlledFixture(port);
    try {
      await fixtureCommand(port, 'setIndex', 15);
      if (await fixture.locator('.academy-deck').getAttribute('data-index') !== '15' || (await fixture.locator('#stage h1').textContent() ?? '').trim() !== 'AI failure modes' || (await fixture.locator('.reveal-grid').count()) !== 1) throw new Error('fixture index did not render slide 16 with fresh visual state');
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics: ${JSON.stringify(fixtureDiagnostics)}`);
      controlledPropCoverage.sameTreeIndexChanges = true;
      return {index: 15};
    } finally {
      await unmountControlledFixture(port);
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics after unmount: ${JSON.stringify(fixtureDiagnostics)}`);
    }
  });
  await check(checks, 'fixture controlled revealStep increase and decrease stays on same slide', async () => {
    fixtureDiagnostics.length = 0;
    const fixture = await mountControlledFixture(port);
    try {
      await fixtureCommand(port, 'setIndex', 15);
      const initialClosed = await fixture.locator('.card.closed').count();
      await fixtureCommand(port, 'setRevealStep', 0);
      const stepZeroIndices = await activeRevealIndices(fixture);
      await fixtureCommand(port, 'setRevealStep', 2);
      const stepTwoIndices = await activeRevealIndices(fixture);
      await fixtureCommand(port, 'setRevealStep', -1);
      await fixture.locator('.card.closed').first().dispatchEvent('click');
      const clickedClosed = await fixture.locator('.card.closed').count();
      const clickIndices = await activeRevealIndices(fixture);
      await fixtureCommand(port, 'setRevealStep', 2);
      const revealedClosed = await fixture.locator('.card.closed').count();
      await fixtureCommand(port, 'setRevealStep', -1);
      const stepMinusOneIndices = await activeRevealIndices(fixture);
      const rewoundClosed = await fixture.locator('.card.closed').count();
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics: ${JSON.stringify(fixtureDiagnostics)}`);
      const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
      if (initialClosed !== 5 || !exact(stepZeroIndices, [0]) || !exact(stepTwoIndices, [0, 1, 2]) || clickedClosed !== 4 || !exact(clickIndices, [0]) || revealedClosed !== 2 || !exact(stepMinusOneIndices, []) || rewoundClosed !== initialClosed || await fixture.locator('.academy-deck').getAttribute('data-index') !== '15') throw new Error(`index=15 closed=${initialClosed}, step0=${JSON.stringify(stepZeroIndices)}, step2=${JSON.stringify(stepTwoIndices)}, clickClosed=${clickedClosed}, click=${JSON.stringify(clickIndices)}, step-1=${JSON.stringify(stepMinusOneIndices)}, rewound=${rewoundClosed}`);
      controlledPropCoverage.sameTreeRevealStepChanges = true;
      return {index: 15, initialClosed, stepZeroIndices, stepTwoIndices, clickedClosed, clickIndices, revealedClosed, stepMinusOneIndices, rewoundClosed};
    } finally {
      await unmountControlledFixture(port);
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics after unmount: ${JSON.stringify(fixtureDiagnostics)}`);
    }
  });
  await check(checks, 'fixture controlled mode changes preserve same slide and replace mode DOM', async () => {
    fixtureDiagnostics.length = 0;
    const fixture = await mountControlledFixture(port);
    try {
      await fixtureCommand(port, 'setIndex', 15);
      await fixtureCommand(port, 'setMode', 'presenter');
      if ((await fixture.locator('.academy-deck').getAttribute('data-index')) !== '15' || (await fixture.locator('.deck-presenter-tools').count()) !== 1) throw new Error('presenter mode did not retain index 15');
      await fixtureCommand(port, 'setMode', 'reader');
      if ((await fixture.locator('.academy-deck').getAttribute('data-index')) !== '15' || (await fixture.locator('.reader-lesson').count()) !== 1 || (await fixture.locator('#stage h1').count()) !== 0) throw new Error('reader mode retained projector heading or changed index');
      await fixtureCommand(port, 'setMode', 'projector');
      if ((await fixture.locator('.academy-deck').getAttribute('data-index')) !== '15' || (await fixture.locator('#stage h1').count()) !== 1) throw new Error('projector mode did not restore heading');
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics: ${JSON.stringify(fixtureDiagnostics)}`);
      controlledPropCoverage.sameTreeModeChanges = true;
      return {index: 15, modes: ['presenter', 'reader', 'projector']};
    } finally {
      await unmountControlledFixture(port);
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics after unmount: ${JSON.stringify(fixtureDiagnostics)}`);
    }
  });
  await check(checks, 'fixture instances keep controlled state independent', async () => {
    fixtureDiagnostics.length = 0;
    const first = await mountControlledFixture(port);
    try {
      const second = await port.evaluate(async () => {
        const module = await import('/src/deck/controlled-fixture.tsx');
        const container = document.createElement('div');
        container.dataset.controlledFixturePeer = 'true';
        container.style.cssText = 'position:absolute;left:-10000px;top:0;width:1440px;min-height:900px;';
        document.body.append(container);
        const controls = module.mount(container);
        window.__deckControlledFixturePeer = {container, controls};
        return true;
      });
      if (!second) throw new Error('peer fixture did not mount');
      const peer = port.locator('[data-controlled-fixture-peer]');
      await peer.locator('.academy-deck').waitFor();
      await fixtureCommand(port, 'setIndex', 15);
      await port.evaluate(() => window.__deckControlledFixturePeer.controls.setIndex(0));
      await port.waitForTimeout(60);
      const firstIndex = await first.locator('.academy-deck').getAttribute('data-index');
      const peerIndex = await peer.locator('.academy-deck').getAttribute('data-index');
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics: ${JSON.stringify(fixtureDiagnostics)}`);
      await port.evaluate(() => { const fixture = window.__deckControlledFixturePeer; fixture.controls.unmount(); fixture.container.remove(); delete window.__deckControlledFixturePeer; });
      if (firstIndex !== '15' || peerIndex !== '0') throw new Error(`first=${firstIndex}, peer=${peerIndex}`);
      controlledPropCoverage.sameTreeInstances = true;
      return {firstIndex, peerIndex};
    } finally {
      await unmountControlledFixture(port);
      if (fixtureDiagnostics.length) throw new Error(`fixture diagnostics after unmount: ${JSON.stringify(fixtureDiagnostics)}`);
    }
  });
  await check(checks, 'reduced motion disables source and port animations', async () => {
    await Promise.all([waitProjector(source, `${sourceUrl}#16`), waitProjector(port, `${portUrl}?index=15`)]);
    const inspect = async (page) => page.evaluate(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const motion = [...document.querySelectorAll('*')].map((node) => {
        const style = getComputedStyle(node);
        const animationDuration = Number.parseFloat(style.animationDuration) || 0;
        const transitionDuration = Number.parseFloat(style.transitionDuration) || 0;
        return {animationName: style.animationName, animationDuration, transitionDuration};
      }).filter((item) => item.animationName !== 'none' || item.transitionDuration > 0);
      return {reduced, maxAnimationDuration: Math.max(0, ...motion.map((item) => item.animationDuration)), maxTransitionDuration: Math.max(0, ...motion.map((item) => item.transitionDuration)), activeMotionRules: motion.length};
    });
    const sourceMotion = await inspect(source);
    const portMotion = await inspect(port);
    if (!sourceMotion.reduced || !portMotion.reduced || sourceMotion.maxAnimationDuration > 0.01 || sourceMotion.maxTransitionDuration > 0.01 || portMotion.maxAnimationDuration > 0.01 || portMotion.maxTransitionDuration > 0.01) throw new Error(`source=${JSON.stringify(sourceMotion)} port=${JSON.stringify(portMotion)}`);
    return {source: sourceMotion, port: portMotion};
  });
} finally {
  await Promise.allSettled([source.close(), port.close(), browser.close()]);
}

await mkdir(output, {recursive: true});
const result = {...provenance(), generatedAt: new Date().toISOString(), sourceUrl, portUrl, fixedEpoch, checks, controlledPropCoverage, fixtureDiagnostics};
await writeFile(join(output, 'report.json'), JSON.stringify(result, null, 2));
const failed = checks.filter((checkResult) => !checkResult.pass);
console.log(JSON.stringify({output, checks: checks.length, failed: failed.length, passed: checks.length - failed.length}));
if (failed.length) process.exitCode = 1;
