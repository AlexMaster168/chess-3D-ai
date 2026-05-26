/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // Vue 3 requires the loose component signature for *.vue imports.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional vue SFC shim
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Optional ambient declaration so TS doesn't error when sibling packages
// aren't built yet. The actual types live in the workspace packages.
declare module '@chess-ai/design';
declare module '@chess-ai/engine';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
