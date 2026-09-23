import {defineConfig} from '@playwright/test';

const port = Number(process.env.ACADEMY_LIVE_PORT ?? 5178);

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/playwright',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: {width: 1280, height: 800},
    colorScheme: 'dark',
  },
  webServer: {
    command:
      `pnpm exec vite build && ACADEMY_LIVE_PORT=${port} ACADEMY_WEB_DIST=dist node --experimental-strip-types ../server/src/live/e2e-server.ts`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{name: 'chromium', use: {browserName: 'chromium'}}],
});
