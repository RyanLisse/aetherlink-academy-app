import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// AET-120: `@` resolves to src/ so shadcn/ui and AI Elements keep their generated import paths.
// PostCSS/Tailwind is wired here (not a root postcss.config) so vendor/proof-sdk and apps/web
// Vite builds do not inherit Academy Tailwind and crash on `blocklist`.
export default defineConfig({
  plugins: [react()],
  resolve: {alias: {'@': fileURLToPath(new URL('./src', import.meta.url))}},
  css: {
    postcss: {
      plugins: [
        tailwindcss({config: fileURLToPath(new URL('./tailwind.config.mjs', import.meta.url))}),
        autoprefixer(),
      ],
    },
  },
  build: {assetsDir: 'academy-assets'},
});
