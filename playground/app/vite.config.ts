import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Vite builds the static playground Pages serves at <repo>/playground/.
// Relative base so the same output works at /playground/ locally and
// /pre-sign-guard/playground/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: resolve(__dirname, '..'),
    emptyOutDir: false, // playground/examples.json lives in the output dir
  },
  server: { fs: { allow: ['..'] } },
});
