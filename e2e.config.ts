import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'chromium',
      engine: web(),
      app: {
        url: 'http://localhost:5178',
        command: {
          executable: 'corepack',
          args: ['pnpm', '--filter', '@academy/web', 'dev'],
          startupTimeout: 120_000,
          log: '.e2e/logs/app.log',
        },
      },
    },
  ],
} satisfies E2EConfig;
