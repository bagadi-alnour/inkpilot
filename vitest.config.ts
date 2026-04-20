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
      '@inkpilot/types': resolve(__dirname, 'src/types'),
      '@inkpilot/core': resolve(__dirname, 'src/core'),
      '@inkpilot/ai': resolve(__dirname, 'src/ai'),
      '@inkpilot/seo': resolve(__dirname, 'src/seo'),
      '@inkpilot/storage': resolve(__dirname, 'src/storage'),
      '@inkpilot/image': resolve(__dirname, 'src/image'),
      '@inkpilot/theme': resolve(__dirname, 'src/theme'),
      '@inkpilot/i18n': resolve(__dirname, 'src/i18n'),
      '@inkpilot/react': resolve(__dirname, 'src/react'),
      '@inkpilot/utils': resolve(__dirname, 'src/utils'),
    },
  },
});
