import { defineConfig } from 'tsup';

// dependencies and peerDependencies are external by default, including @tiptap/* subpaths.
// `npm run build` clears dist first; neither config cleans so they can't race.
export default defineConfig([
  {
    // Browser entry: the React editor. Marked as a client module for React Server Components.
    entry: { index: 'src/index.ts', 'theme/styles': 'src/theme/styles.css' },
    format: ['esm', 'cjs'],
    dts: { entry: { index: 'src/index.ts' } },
    splitting: true,
    sourcemap: true,
    // Rollup tree-shaking (`treeshake: true`) strips module directives, so esbuild's own
    // tree-shaking is used here to keep the banner.
    banner: { js: '"use client";' },
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    // Server entry: the AI handler. ESM only, like the AI SDK it wraps.
    entry: { server: 'src/server/index.ts' },
    format: ['esm'],
    dts: true,
    treeshake: true,
    sourcemap: true,
    platform: 'neutral',
  },
]);
