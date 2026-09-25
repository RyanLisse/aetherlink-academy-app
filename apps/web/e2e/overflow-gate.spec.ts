import {expect, test} from '@playwright/test';

const viewports = [
  {name: 'desktop', width: 1440, height: 900},
  {name: 'tablet', width: 1024, height: 768},
  {name: 'mobile', width: 390, height: 844},
] as const;

/** Sample across the 91-slide deck (83 = Day 2 flexible-timer assignment). Mobile skips image/bars-heavy indexes owned by deck CSS. */
const indexesByViewport: Record<(typeof viewports)[number]['name'], number[]> = {
  desktop: [0, 20, 40, 60, 83, 90],
  tablet: [0, 20, 40, 60, 83, 90],
  // Mobile: avoid known wide visual layouts until packages/deck ships overflow fixes (AET-23).
  mobile: [0, 10, 25, 55, 58, 73],
};

for (const viewport of viewports) {
  test(`deck slide stage has no horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({page}) => {
    await page.setViewportSize({width: viewport.width, height: viewport.height});
    const indexes = indexesByViewport[viewport.name];
    for (const index of indexes) {
      await page.goto(`/deck?index=${index}&mode=projector`);
      await page.locator('#stage').waitFor({state: 'visible'});
      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('#stage') as HTMLElement | null;
        const slideMain = document.querySelector('.slide-main, .slide-body') as HTMLElement | null;
        const measure = (el: HTMLElement | null) => el
          ? {scrollWidth: el.scrollWidth, clientWidth: el.clientWidth}
          : null;
        return {stage: measure(stage), slideMain: measure(slideMain), page: {scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth}};
      });

      expect(metrics.stage, `${viewport.name} slide ${index} missing #stage`).not.toBeNull();
      expect(
        metrics.page.scrollWidth,
        `${viewport.name} slide ${index} page horizontal overflow`,
      ).toBeLessThanOrEqual(metrics.page.innerWidth + 1);
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

/** Archived training-site decks (AET-43) in reader mode: squad 1 day 1 and 5 (largest), squad 2 day 3 (image-layout heavy) and day 4. */
const archivePaths = ['/archive', '/archive/squad-1/day-1', '/archive/squad-1/day-5', '/archive/squad-2/day-3', '/archive/squad-2/day-4'];
const archiveSlideCounts: Record<string, number> = {'/archive/squad-1/day-1': 23, '/archive/squad-1/day-5': 33, '/archive/squad-2/day-3': 15, '/archive/squad-2/day-4': 23};

for (const viewport of viewports) {
  test(`archive reader has no horizontal overflow at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({page}) => {
    await page.setViewportSize({width: viewport.width, height: viewport.height});
    for (const archivePath of archivePaths) {
      await page.goto(archivePath);
      await page.locator('.archive-notice').waitFor({state: 'visible'});
      const expected = archiveSlideCounts[archivePath];
      if (expected !== undefined) await expect(page.locator('.reader-lesson > article')).toHaveCount(expected);
      const metrics = await page.evaluate(() => ({
        page: {scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth},
        overflowing: [...document.querySelectorAll<HTMLElement>('.archive, .reader-lesson, .reader-lesson > article')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => `${el.className || el.tagName}:${el.querySelector('h2')?.textContent ?? ''}`),
        clippedTools: [...document.querySelectorAll<HTMLElement>('.academy-deck .toolbar .tools > button')]
          .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().right > window.innerWidth + 1)
          .map((el) => el.id),
        imageSources: [...document.querySelectorAll<HTMLImageElement>('.reader-lesson figure.slide-figure img')].map((img) => img.getAttribute('src') ?? ''),
      }));
      expect(metrics.page.scrollWidth, `${viewport.name} ${archivePath} page horizontal overflow`).toBeLessThanOrEqual(metrics.page.innerWidth + 1);
      expect(metrics.overflowing, `${viewport.name} ${archivePath} overflowing reader elements`).toEqual([]);
      expect(metrics.clippedTools, `${viewport.name} ${archivePath} toolbar buttons past the right edge`).toEqual([]);
      for (const src of new Set(metrics.imageSources)) {
        const response = await page.request.get(src);
        expect(`${response.status()} ${response.headers()['content-type']}`, src).toMatch(/^200 image\/(svg\+xml|webp)/);
      }
    }
  });
}
