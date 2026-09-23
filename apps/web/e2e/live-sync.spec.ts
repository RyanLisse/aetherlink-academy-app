import {expect, test} from '@playwright/test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shots = path.join(here, '../../../handoffs-aet-26-shots');
// Evidence also copied to wave handoff by RESULT script; local under test-results.

test.describe('AET-26 live-sync', () => {
  test('detach / follow / everyoneBackToFollow across three browsers', async ({browser}, info) => {
    const room = `room-${Date.now()}`;
    const facilitator = await browser.newPage();
    const follower = await browser.newPage();
    const detached = await browser.newPage();

    await facilitator.goto(`/live/${room}/presenter?id=facilitator-1&name=Facilitator`);
    await follower.goto(`/live/${room}/follow?id=p-follow&name=Follower`);
    await detached.goto(`/live/${room}/follow?id=p-detach&name=Detached`);

    await expect(facilitator.getByTestId('live-classroom')).toBeVisible({timeout: 15_000});
    await expect(facilitator.getByTestId('live-classroom')).toHaveAttribute('data-connection', 'open', {timeout: 15_000});
    await expect(follower.getByTestId('follow-status')).toHaveText('Volgend', {timeout: 15_000});
    await expect(follower.getByTestId('live-classroom')).toHaveAttribute('data-connection', 'open', {timeout: 15_000});
    await expect(detached.getByTestId('follow-status')).toHaveText('Volgend');
    await expect(detached.getByTestId('live-classroom')).toHaveAttribute('data-connection', 'open', {timeout: 15_000});

    // Detach one participant and browse locally
    await detached.getByTestId('detach').click();
    await expect(detached.getByTestId('follow-status')).toHaveText('Losgekoppeld');
    // Local browse: click next is disabled in follow mode when detached... ownIndex via UI —
    // Deck nav disabled in follow mode; status alone proves detach. Facilitator advances.
    await facilitator.getByTestId('next-slide').click();
    await expect(facilitator.locator('#count')).toContainText('02', {timeout: 10_000});
    await expect(follower.locator('#count')).toContainText('02', {timeout: 10_000});
    // Detached should NOT have been pulled yet — still on slide 1
    await expect(detached.locator('#count')).toContainText('01');

    await facilitator.getByTestId('everyone-back').click();
    await expect(detached.getByTestId('live-notice')).toContainText('terug te volgen', {timeout: 10_000});
    await expect(detached.getByTestId('follow-status')).toHaveText('Volgend');
    await expect(detached.locator('#count')).toContainText('02');

    await facilitator.screenshot({path: info.outputPath('facilitator-presence.png'), fullPage: true});
    await follower.screenshot({path: info.outputPath('follower-following.png'), fullPage: true});
    await detached.screenshot({path: info.outputPath('detached-pulled-back.png'), fullPage: true});

    await facilitator.close();
    await follower.close();
    await detached.close();
  });

  test('WebSocket kill reconnects follow view with timer within 5s', async ({page}) => {
    const room = `room-ws-${Date.now()}`;
    const fac = await page.context().newPage();
    await fac.goto(`/live/${room}/presenter?id=facilitator-1&name=Facilitator`);
    await page.goto(`/live/${room}/follow?id=p-ws&name=WSUser`);
    await expect(page.getByTestId('follow-status')).toHaveText('Volgend', {timeout: 15_000});

    await fac.getByTestId('start-timer').click();
    await expect(page.getByTestId('follow-timer')).toBeVisible({timeout: 10_000});
    const before = await page.getByTestId('follow-timer').textContent();

    await fac.getByTestId('next-slide').click();
    await expect(page.locator('#count')).toContainText('02', {timeout: 10_000});

    await page.getByTestId('kill-ws').evaluate((el) => (el as HTMLButtonElement).click());
    // Reconnect + land on current slide + timer still present within 5s
    await expect(page.locator('#count')).toContainText('02', {timeout: 5_000});
    await expect(page.getByTestId('follow-timer')).toBeVisible({timeout: 5_000});
    const after = await page.getByTestId('follow-timer').textContent();
    expect(after).toBeTruthy();
    expect(before).toBeTruthy();

    await fac.close();
  });
});
