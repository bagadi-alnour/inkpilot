import path from 'path';
import { fileURLToPath } from 'url';

// The repo root: the demo loads `@inkpilot/editor` from `..`, and Turbopack only reads
// files inside its root. File tracing uses the same root, as Next requires.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@inkpilot/editor'],
  turbopack: { root },
  outputFileTracingRoot: root,
  // Keeps the dev badge out of the docs screenshots.
  devIndicators: false,
};

export default nextConfig;
