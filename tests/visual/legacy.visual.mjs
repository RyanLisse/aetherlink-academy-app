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

  test(`participant classroom ${width}`, async ({page}) => {
    await open(page, {width, height});
    await page.goto(`${fixture.base}/#access=${fixture.participantAccess}`);
    await page.getByTestId('classroom-shell').waitFor();
    await page.getByTestId('classroom-home').waitFor();
    await page.getByTestId('classroom-grid').waitFor();
    await settle(page);
    await expect(page).toHaveScreenshot(`participant-classroom-${width}.png`, {fullPage: true});
  });
}

test('facilitator classroom landing 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768, token: fixture.facilitatorToken});
  await page.goto(fixture.base + '/');
  await page.getByTestId('classroom-shell').waitFor();
  await page.getByTestId('classroom-home').waitFor();
  await expect(page.getByTestId('classroom-grid')).toBeVisible();
  await expect(page.getByTestId('nav-admin')).toBeVisible();
  await expect(page.locator('.join-copy')).toHaveCount(0);
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-classroom-1024.png');
});

test('facilitator overview 1024', async ({page}) => {
  await open(page, {width: 1024, height: 768});
  await page.goto(fixture.base + '/facilitator');
  await page.getByLabel('Facilitator-startsleutel').fill(HOST_KEY);
  await page.getByRole('button', {name: 'Inloggen'}).click();
  await page.getByRole('heading', {name: 'Wave oktober (synthetisch)'}).waitFor();
  await settle(page);
  await expect(page).toHaveScreenshot('facilitator-overview-1024.png', {fullPage: true});
});
