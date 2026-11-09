import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@inkpilot/editor'],
  outputFileTracingRoot: path.join(__dirname),
  // Keeps the dev badge out of the docs screenshots.
  devIndicators: false,
};

export default nextConfig;
