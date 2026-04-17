import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/index.ts', 'src/types/**'],
    },
  },
  resolve: {
    alias: {
      '@writeflow/types': resolve(__dirname, 'src/types'),
      '@writeflow/core': resolve(__dirname, 'src/core'),
      '@writeflow/ai': resolve(__dirname, 'src/ai'),
      '@writeflow/seo': resolve(__dirname, 'src/seo'),
      '@writeflow/storage': resolve(__dirname, 'src/storage'),
      '@writeflow/image': resolve(__dirname, 'src/image'),
      '@writeflow/theme': resolve(__dirname, 'src/theme'),
      '@writeflow/i18n': resolve(__dirname, 'src/i18n'),
      '@writeflow/react': resolve(__dirname, 'src/react'),
      '@writeflow/utils': resolve(__dirname, 'src/utils'),
    },
  },
});
