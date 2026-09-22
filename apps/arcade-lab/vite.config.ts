import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Served under Academy at /arcade-lab/ (same Docker image).
  base: '/arcade-lab/',
  publicDir: 'public',
  server: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
