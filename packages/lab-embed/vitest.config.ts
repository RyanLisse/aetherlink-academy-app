import {tmpdir} from 'node:os';
import path from 'node:path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  cacheDir: path.join(tmpdir(), 'academy-wave-vitest', 'lab-embed'),
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
