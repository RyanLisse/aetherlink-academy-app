import {expect, test} from '@playwright/test';

const viewports = [
  {name: 'desktop', width: 1440, height: 900},
  {name: 'tablet', width: 1024, height: 768},
  {name: 'mobile', width: 390, height: 844},
] as const;

for (const viewport of viewports) {
  test(`deck slide stage has no horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({page}) => {
    await page.setViewportSize({width: viewport.width, height: viewport.height});
    await page.goto('/deck?index=0&mode=projector');
    await page.locator('#stage').waitFor({state: 'visible'});

    // Sample a few slides across the deck (first, mid, near-end).
    const indexes = [0, 20, 40, 60, 77];
    for (const index of indexes) {
      await page.goto(`/deck?index=${index}&mode=projector`);
      await page.locator('#stage').waitFor({state: 'visible'});
      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('#stage') as HTMLElement | null;
        const slideMain = document.querySelector('.slide-main, .slide-body') as HTMLElement | null;
        const measure = (el: HTMLElement | null) => el
          ? {scrollWidth: el.scrollWidth, clientWidth: el.clientWidth}
          : null;
        return {
          stage: measure(stage),
          slideMain: measure(slideMain),
        };
      });

      expect(metrics.stage, `${viewport.name} slide ${index} missing #stage`).not.toBeNull();
      expect(
        metrics.stage!.scrollWidth,
        `${viewport.name} slide ${index} #stage horizontal overflow`,
      ).toBeLessThanOrEqual(metrics.stage!.clientWidth + 1);

      if (metrics.slideMain) {
        expect(
          metrics.slideMain.scrollWidth,
          `${viewport.name} slide ${index} slide-main horizontal overflow`,
        ).toBeLessThanOrEqual(metrics.slideMain.clientWidth + 1);
      }
    }
  });
}
