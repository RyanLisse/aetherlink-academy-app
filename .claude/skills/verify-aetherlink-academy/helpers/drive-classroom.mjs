#!/usr/bin/env node
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {DEPLOYED_ORIGIN, evidenceRoot, requireCurrentRun} from './lib.mjs';

const deployed = process.argv[2] === '--deployed';
const run = deployed ? null : requireCurrentRun();
const origin = deployed ? DEPLOYED_ORIGIN : `http://127.0.0.1:${run.ports.academy}`;
const outDir = deployed ? path.join(evidenceRoot, `deployed-${new Date().toISOString().replace(/[:.]/g, '-')}`, 'classroom') : path.join(run.evidenceDir, 'classroom');
mkdirSync(outDir, {recursive: true});

const steps = [];
const record = (step, ok, observed) => {
  steps.push({step, ok, observed});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${step}: ${JSON.stringify(observed)}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1440, height: 900}, colorScheme: 'dark'});
const KNOWN_BROKEN = ['/assets/aetherlink-mark.png'];
const pageErrors = [];
const failedRequests = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('response', (res) => res.status() >= 400 && failedRequests.push({status: res.status(), path: new URL(res.url()).pathname}));

const count = () => page.locator('#count').innerText();
const currentTitle = () => page.locator('#progress [aria-current="step"]').getAttribute('aria-label');
const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
const capture = async (name) => {
  await settle();
  writeFileSync(path.join(outDir, `${name}.aria.yml`), await page.locator('body').ariaSnapshot());
  await page.screenshot({path: path.join(outDir, `${name}.png`), fullPage: true});
};

try {
  const response = await page.goto(`${origin}/classroom/1`);
  await page.locator('#count').waitFor();
  const first = await count();
  const total = Number(first.split('/')[1]);
  record('projector opens on slide 1', response.status() === 200 && first.startsWith('01 /') && total > 1, {status: response.status(), count: first, title: await currentTitle()});
  await capture('01-projector-slide1');

  await page.getByRole('button', {name: 'Next slide'}).click();
  await page.locator('#count').filter({hasText: /^02 \//}).waitFor({timeout: 5000});
  record('Next slide button advances to slide 2', true, {count: await count(), title: await currentTitle()});

  await page.locator('#stage').focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('#count').filter({hasText: /^03 \//}).waitFor({timeout: 5000});
  record('ArrowRight advances to slide 3', true, {count: await count(), title: await currentTitle()});
  await capture('02-projector-slide3');

  await page.goto(`${origin}/classroom/1?mode=presenter&index=2`);
  await page.getByRole('heading', {name: 'Facilitator notes'}).waitFor();
  const nextLine = await page.locator('.presenter-tools p').filter({hasText: /^Next slide:/}).innerText();
  record('presenter mode shows notes and next-slide preview', (await count()).startsWith('03 /'), {count: await count(), nextLine});
  await capture('03-presenter-slide3');

  await page.goto(`${origin}/classroom/1?mode=reader`);
  const articles = await page.getByRole('region', {name: 'Lesson reading'}).locator(':scope > article').count();
  record('reader mode lists every classroom slide', articles === total, {articles, total});
} catch (error) {
  record('drive aborted', false, {error: error.message.split('\n')[0]});
  await page.screenshot({path: path.join(outDir, 'failure.png')}).catch(() => {});
} finally {
  await browser.close();
}

const known = failedRequests.filter((r) => KNOWN_BROKEN.includes(r.path));
const unexpected = failedRequests.filter((r) => !KNOWN_BROKEN.includes(r.path));
record('no page errors or unexpected failed requests', pageErrors.length === 0 && unexpected.length === 0, {pageErrors: pageErrors.slice(0, 5), unexpected: unexpected.slice(0, 5)});
if (known.length) console.log(`KNOWN BUG still present: ${[...new Set(known.map((r) => `${r.status} ${r.path}`))].join(', ')} (see features/classroom-deck.md Gotchas)`);
const ok = steps.every((s) => s.ok);
writeFileSync(path.join(outDir, 'state.json'), `${JSON.stringify({feature: 'classroom-deck', entry: '/classroom/1', origin, runId: run?.runId ?? null, revision: run?.revision ?? null, at: new Date().toISOString(), ok, steps, knownBroken: [...new Set(known.map((r) => `${r.status} ${r.path}`))]}, null, 2)}\n`);
console.log(`${ok ? 'DRIVE OK' : 'DRIVE FAILED'} evidence=${outDir}`);
process.exit(ok ? 0 : 1);
