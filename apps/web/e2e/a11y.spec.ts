import {AxeBuilder} from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

const viewports = [
  {name: 'desktop', width: 1440, height: 900},
  {name: 'mobile', width: 390, height: 844},
] as const;

/** apps/web SPA paths production serves (server/app.mjs isWebSpaPath), minus /live which needs a room. */
const routes = [
  '/deck',
  '/classroom/1',
  '/classroom/2',
  '/workshop/3',
  '/workshop/4',
  '/workshop/5',
  '/workshop/6',
  '/workshop/7',
  '/lesson',
] as const;

const blockingImpacts = new Set(['serious', 'critical']);

for (const viewport of viewports) {
  for (const route of routes) {
    test(`a11y: ${route} has no serious or critical axe violations at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({page}) => {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      await page.goto(route);
      await page.locator('#stage, main').first().waitFor({state: 'visible'});
      // Deck entrance fades blend text into the background mid-animation; axe must judge the settled frame.
      await page.waitForFunction(() =>
        document.getAnimations().every((animation) =>
          animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity));

      const {violations} = await new AxeBuilder({page})
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = violations
        .filter((violation) => blockingImpacts.has(violation.impact ?? ''))
        .map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          count: violation.nodes.length,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target.join(' ')),
        }));

      expect(blocking, `${route} at ${viewport.name}:\n${JSON.stringify(blocking, null, 2)}`).toEqual([]);
    });
  }
}
