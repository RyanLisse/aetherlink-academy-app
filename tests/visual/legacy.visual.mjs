import {test, expect} from '@playwright/test';
import {startLegacyFixture, FIXED_NOW, HOST_KEY} from '../support/legacy-fixture.mjs';


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
    await page.getByTestId('today-next').waitFor();
    await page.waitForFunction(()=>!document.querySelector('.primary [data-status="loading"]'));
    await settle(page);
    await expect(page).toHaveScreenshot(`participant-room-${width}.png`, {fullPage: true});
  });
}

test('facilitator workshop landing 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768, token: fixture.facilitatorToken});
  await page.goto(fixture.base + '/');
  await page.getByRole('heading', {name: 'Squad Noord'}).waitFor();
  await expect(page.locator('.simple-eyebrow')).toHaveText('Facilitatorwerkplek · Dag 1');
  await expect(page.getByRole('heading', {name: 'Jouw workshop'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Slides presenteren'})).toBeVisible();
  await expect(page.getByRole('region', {name: 'Facilitatorbediening'})).toHaveCount(0);
  await expect(page.locator('.simple-settings')).toHaveCount(0);
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-room-1024.png');
});

test('facilitator overview 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768});
  await page.goto(fixture.base + '/');
  await page.getByRole('radio', {name: 'Ik ben facilitator'}).check();
  await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
  await page.getByRole('button', {name: 'Inloggen'}).click();
  await page.getByRole('heading', {name: 'Wave oktober (synthetisch)'}).waitFor();
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-overview-1024.png', {fullPage: true});
});
