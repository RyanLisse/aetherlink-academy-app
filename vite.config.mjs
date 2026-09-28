import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
// AET-120: `@` resolves to src/ so shadcn/ui and AI Elements keep their generated import paths.
export default defineConfig({plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},build:{assetsDir:'academy-assets'}});
