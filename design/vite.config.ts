import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ command }) => {
  const isLibBuild = command === 'build';
  return {
    root: isLibBuild ? undefined : resolve(__dirname, 'demo'),
    server: {
      port: 5174,
      open: true
    },
    resolve: {
      alias: {
        '@chess-ai/design': resolve(__dirname, 'src/index.ts')
      }
    },
    build: isLibBuild
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'ChessAiDesign',
            fileName: () => 'index.js',
            formats: ['es']
          },
          sourcemap: true,
          emptyOutDir: false,
          rollupOptions: {
            external: ['three', 'gsap'],
            output: {
              globals: {
                three: 'THREE',
                gsap: 'gsap'
              }
            }
          }
        }
      : undefined
  };
});
