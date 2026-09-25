import {test, expect} from '@playwright/test';
import {startLegacyFixture, FIXED_NOW, HOST_KEY} from '../support/legacy-fixture.mjs';

const PROOF_STUB = '<!doctype html><html lang="nl"><head><title>Proof</title></head><body style="margin:0;font:16px sans-serif;background:#0c1928;color:#e3ecfa"><p style="padding:24px">Synthetisch Proof-document</p></body></html>';

// A fresh fixture per test: presence ("online") depends on which browser polled last.
let fixture;
test.beforeEach(async () => { fixture = await startLegacyFixture(); });
test.afterEach(async () => { await fixture?.close(); });

async function open(page, {width, height, token = null}) {
  await page.setViewportSize({width, height});
  await page.clock.setFixedTime(new Date(FIXED_NOW));
  await page.addInitScript((value) => {
    localStorage.setItem('academy-locale', 'nl');
    localStorage.setItem('academy-theme', 'dark');
    if (value) sessionStorage.setItem('academy-token', value);
  }, token);
  await page.route('**/d/**', (route) => route.fulfill({contentType: 'text/html', body: PROOF_STUB}));
}

const settle = (page) => page.evaluate(() => document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))));

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`join ${width}`, async ({page}) => {
    await open(page, {width, height});
    await page.goto(fixture.base + '/');
    await page.getByRole('heading', {name: 'Welkom bij je squad'}).waitFor();
    await settle(page);
    await expect(page).toHaveScreenshot(`join-${width}.png`, {fullPage: true});
  });

  test(`participant room ${width}`, async ({page}) => {
    await open(page, {width, height});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByRole('heading', {name: 'Squad Noord'}).waitFor();
    await page.getByText('Editor laden…').waitFor();
    await settle(page);
    await expect(page).toHaveScreenshot(`participant-room-${width}.png`, {fullPage: true});
  });
}

test('facilitator room 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768, token: fixture.facilitatorToken});
  await page.goto(fixture.base + '/');
  await page.getByRole('region', {name: 'Facilitatorbediening'}).waitFor();
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-room-1024.png');
});

test('facilitator overview 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768});
  await page.goto(fixture.base + '/');
  await page.getByRole('button', {name: 'Facilitator-overzicht'}).click();
  await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
  await page.getByRole('button', {name: 'Toon overzicht'}).click();
  await page.getByRole('heading', {name: 'Wave oktober (synthetisch)'}).waitFor();
  await page.getByLabel('Facilitator-startsleutel').blur();
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-overview-1024.png', {fullPage: true});
});
