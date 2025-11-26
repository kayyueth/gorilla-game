import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'assets',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'assets')
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
