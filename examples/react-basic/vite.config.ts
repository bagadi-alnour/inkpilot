import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { inkpilotDevServer } from './server/inkpilot-plugin';

const rootPkg = path.resolve(__dirname, '../../');

export default defineConfig(({ mode }) => {
  // Server-only keys (no VITE_ prefix, so they never reach the browser bundle).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ['ANTHROPIC_', 'OPENAI_', 'INKPILOT_']));

  return {
    plugins: [react(), inkpilotDevServer()],
    resolve: {
      alias: {
        '@inkpilot/editor/styles.css': path.join(rootPkg, 'dist/theme/styles.css'),
        '@inkpilot/editor': path.join(rootPkg, 'dist/index.js'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
