import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@chess-ai/design': fileURLToPath(
        new URL('../design/src/index.ts', import.meta.url),
      ),
      '@chess-ai/engine': fileURLToPath(
        new URL('../ai-engine/src/index.ts', import.meta.url),
      ),
    },
    dedupe: ['three', 'gsap', 'chess.js', 'vue'],
  },
  optimizeDeps: {
    exclude: ['@chess-ai/design', '@chess-ai/engine'],
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
