import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootPkg = path.resolve(__dirname, '../../');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@writeflow/editor/styles.css': path.join(rootPkg, 'dist/index.css'),
      '@writeflow/editor': path.join(rootPkg, 'dist/index.js'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
