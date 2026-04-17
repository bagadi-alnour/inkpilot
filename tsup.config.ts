import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/styles.css'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@tiptap/extension-placeholder',
    '@tiptap/extension-image',
    '@tiptap/extension-link',
    '@tiptap/extension-highlight',
    '@tiptap/extension-underline',
    '@tiptap/extension-text-align',
    '@tiptap/extension-color',
    '@tiptap/extension-text-style',
    '@tiptap/extension-code-block-lowlight',
  ],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
