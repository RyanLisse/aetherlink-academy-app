import {tmpdir} from 'node:os';
import path from 'node:path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  cacheDir: path.join(tmpdir(), 'academy-wave-vitest', 'concept-sim'),
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
