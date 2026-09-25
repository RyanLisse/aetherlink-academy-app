import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const apiTarget = process.env.ACADEMY_API_URL ?? 'http://127.0.0.1:4318';
const proxy = {
  '^/health(\\?.*)?$': {target: apiTarget, changeOrigin: false},
  '^/connection(\\?.*)?$': {target: apiTarget, changeOrigin: false},
  '^/authoring-api(/.*)?$': {target: apiTarget, changeOrigin: false},
  '^/live': {target: apiTarget, changeOrigin: false, ws: true},
};

export default defineConfig({
  plugins: [react()],
  server: {port: 5178, strictPort: true, proxy},
  preview: {port: 5178, strictPort: true, proxy},
  build: {outDir: 'dist', assetsDir: 'academy-assets', emptyOutDir: true},
});
