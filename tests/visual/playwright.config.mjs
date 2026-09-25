import {defineConfig} from '@playwright/test';

// Baselines are rendered inside the pinned Playwright image (see scripts/visual-baselines.sh);
// CI runs the same image, so the snapshots carry no platform suffix.
export default defineConfig({
  testDir: '.',
  testMatch: '*.visual.mjs',
  outputDir: '../../test-results/legacy-visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', {open: 'never', outputFolder: '../../playwright-report/legacy-visual'}]] : 'list',
  expect: {toHaveScreenshot: {animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixels: 0}},
  use: {browserName: 'chromium', locale: 'nl-NL', timezoneId: 'Europe/Amsterdam', colorScheme: 'dark', reducedMotion: 'reduce'},
});
