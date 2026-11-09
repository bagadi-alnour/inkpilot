// Bundle the published entries the way an app would and enforce two things:
// 1. the client entry never pulls in server-only or provider packages, and the server
//    entry never pulls in React or Tiptap;
// 2. what the client entry ships on top of React and Tiptap stays within budget.
// Run after `npm run build`.
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

// Our own code plus turndown, about 24 kB. Syntax highlighting is opt-in (`codeBlock` prop),
// so highlight.js grammars never count here.
const CLIENT_BUDGET_GZIP_BYTES = 30_000;

const RULES = [
  { entry: 'dist/index.js', forbidden: [/^ai(\/|$)/, /^@ai-sdk\//, /^zod(\/|$)/, /^@aws-sdk\//] },
  { entry: 'dist/server.js', forbidden: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@tiptap\//] },
];

/** Packages the host app already has; they don't count toward the budget. */
const SHARED = ['react', 'react-dom', 'react/jsx-runtime', '@tiptap/*', 'prosemirror-*'];

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`✗ ${message}`);
};

for (const { entry, forbidden } of RULES) {
  // Keep every bare import external so the metafile lists exactly what the entry imports.
  const result = await build({ entryPoints: [entry], bundle: true, write: false, metafile: true, packages: 'external', format: 'esm', logLevel: 'silent' });
  const imports = new Set(Object.values(result.metafile.outputs).flatMap((output) => output.imports.filter((i) => i.external).map((i) => i.path)));
  const bad = [...imports].filter((specifier) => forbidden.some((pattern) => pattern.test(specifier)));
  if (bad.length) fail(`${entry} imports ${bad.join(', ')}`);
  else console.log(`✓ ${entry} imports only allowed packages`);
}

const client = await build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  write: false,
  minify: true,
  format: 'esm',
  platform: 'browser',
  external: SHARED,
  loader: { '.css': 'empty' },
  logLevel: 'silent',
});
const gzipped = gzipSync(client.outputFiles[0].contents).length;
const summary = `client entry: ${(gzipped / 1000).toFixed(1)} kB gzipped (budget ${(CLIENT_BUDGET_GZIP_BYTES / 1000).toFixed(0)} kB, excluding React and Tiptap)`;
if (gzipped > CLIENT_BUDGET_GZIP_BYTES) fail(summary);
else console.log(`✓ ${summary}`);

process.exit(failed ? 1 : 0);
