import { defineConfig } from 'vite';

export default defineConfig({
  base: '/DavidProj/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true
  }
});
