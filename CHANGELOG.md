# Changelog

All notable changes to `@inkpilot/editor` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - Unreleased

SEO checks and AI now work as one loop: issues point at text, Fix with AI proposes a change in place, and you accept it as one undo step. You bring the model and the image storage. This release breaks the 0.1 API; see [Migrating from 0.1](#migrating-from-01).

### Added

- `@inkpilot/editor/server` with `createInkpilotHandler({ model, authorize })`: a Web `Request -> Response` route for any AI SDK 7 model. Tasks `fix`, `rewrite` (NDJSON streams that end with an explicit `done`), plus `titles`, `descriptions` and `alt` (schema-checked JSON). It requires `authorize` (or an explicit `'public'`), has size limits and per-task output caps, and aborts the model call when the client cancels.
- Live SEO engine with ranges: missing or duplicate H1, skipped heading levels, title and description length, generic titles, alt text, embedded images, long sentences, dense paragraphs, reading ease (English), and keyword placement and density. Thresholds are configurable (`seo.rules`), and length findings are `info`. Issues are underlined in the text and a score sits in the toolbar.
- Fix with AI from an underlined issue or the publish panel. Proposals stream in as tracked changes (option A preview), Enter accepts and Esc rejects, and accept is a single undo step. Unsupported selections are refused with a reason.
- Publish panel (side drawer): checks with Fix / Suggest / Show, SEO title and description with on-demand AI suggestions, a slug that follows the title until edited, and a search preview. `defaultMeta`, `onMetaChange`, `seo.baseUrl`.
- `image.upload` (any `ImageUploader`) and `presignedUpload(endpoint)`. Uploads stay correct under undo and redo, failed uploads are removed and reported through `onUploadError`, and images are compressed on a canvas before upload. AI alt text is applied only if the writer hasn't typed one.
- `useSEOReport`, `slugify`, `analyzeDocument`, `createFetchTransport`, and a `transport` option for custom backends.
- `t(key, params)` with `{placeholder}` values; translation keys for every SEO issue code are type-checked.
- `codeBlock` prop: pass your own code block node, for example `CodeBlockLowlight` with the languages you need.
- `npm run check:bundle`: enforces the client/server import boundary and a 30 kB gzip budget (excluding React and Tiptap).

### Changed

- Tiptap 3 (3.33). Link and Underline come from StarterKit.
- Model I/O uses a restricted HTML subset instead of plain text, so formatting, color and alignment round-trip. Model output is parsed in an inert document and validated before it can be accepted.
- The floating AI toolbar is a Tiptap BubbleMenu and hides while a proposal is open.
- Shortcuts are now Cmd/Ctrl+Alt+R (rewrite) and Cmd/Ctrl+Alt+P (publish panel). The old Shift combinations collided with browser reload and private window.
- `ai` and `zod` are optional peer dependencies, needed only on the server. Node 22+ for the server entry.
- The client entry is marked `"use client"`.
- Code blocks are plain by default. 0.1 bundled lowlight with its 37 common languages (about 50 kB gzipped) but shipped no highlight.js theme, so the highlighting only showed up if your app added one. The client entry is now 24 kB gzipped, down from 77 kB.

### Removed

- Client-side providers: `ai.provider`, `ai.apiKey`, `ai.model`, `ai.baseURL`, `createAIProvider`, `resolveAIFromEnv`.
- Storage: `storage` prop, `StorageConfig`, S3 adapter, `createStorageAdapter`, `resolveStorageFromEnv`, `useStorage`, and the AWS SDK dependency.
- The old pre-publish panel, `useSEOAnalysis`, `analyzeContent`, `SEOSignal`, `SEOAnalysis`, `SEOSuggestion`, `generateSERPPreview`, the "Missing H1" banner, `computeDiff`, and the event emitter types.
- Dependencies: `@ai-sdk/*`, `@aws-sdk/*`, `browser-image-compression`, `diff-match-patch`, `lowlight`, `@tiptap/extension-code-block-lowlight`.

### Fixed

- Word count and reading time counted adjacent blocks as one word.
- AI rewrites streamed into the document as HTML, lost formatting, and added an undo step per chunk.
- Enter and Esc for the rewrite panel were captured on the whole page.
- Opening the review panel with inline props re-sent AI requests on every render.
- Dropped images were inserted at the cursor instead of the drop point. Failed uploads were silently embedded as base64. Alt text defaulted to the file name.
- The toolbar link button normalises hrefs and only accepts `http`, `https`, `mailto` and `tel`.

### Migrating from 0.1

**AI.** Move the model to a server route and point the editor at it.

```diff
- <Editor ai={{ provider: 'openai', apiKey: 'server-proxy', baseURL: '/api/ai/openai' }} />
+ <Editor ai={{ endpoint: '/api/inkpilot' }} />
```

```ts
// app/api/inkpilot/route.ts
import { createInkpilotHandler } from '@inkpilot/editor/server';
import { openai } from '@ai-sdk/openai';
export const POST = createInkpilotHandler({ model: openai('gpt-5-mini'), authorize: (req) => isSignedIn(req) });
```

Delete your provider proxy route. `defaultTone`, `defaultIntent`, `preserveMeaning` and `onRewrite` keep their meaning. `onRewrite` now fires on accept and reject of a finished proposal.

**Images.** Replace `storage` with an uploader. A 0.1 presigned endpoint works as is:

```diff
- <Editor storage={{ provider: 's3', bucket: 'b', presignedUrlEndpoint: '/api/upload' }} />
+ <Editor image={{ upload: presignedUpload('/api/upload') }} />
```

`image.responsiveSizes` and `image.formats` are gone.

**SEO props.**

```diff
- seo={{ lightSignals: true, targetKeywords: ['x'], onAnalysis }}
+ seo={{ liveSignals: true, keywords: ['x'] }}
```

**Publishing.**

```diff
- onPublish={(content, analysis) => save(content.html, analysis.score)}
+ onPublish={({ content, meta, report }) => save(content.html, meta.slug, report.score)}
```

`report.issues` items are `{ id, code, severity, params, range?, fix? }`. Render them with ``t(`seo.issue.${code}`)`` and ``t(`seo.issue.${code}.detail`, params)`` instead of a `message`.

**Hooks.** `useSEOAnalysis` becomes `useSEOReport(editor)`. `useAIRewrite(editor)` now returns `{ session, rewrite, accept, reject, retry }`. `useStorage` is gone.

**Translations.** Keys for removed UI are gone (`ai.accept`, `ai.reject`, `ai.rewriting`, `seo.panel.*`, `seo.serp.*`, `image.*`, signal keys). New groups: `rewrite.*`, `seo.issue.*`, `publish.*`.

**Shortcuts.** Cmd/Ctrl+Shift+P is now Cmd/Ctrl+Alt+P.

**Syntax highlighting.** If your app styled `hljs-*` tokens, install the highlighter yourself and pass it in. Existing code blocks keep their content and language.

```bash
npm install lowlight @tiptap/extension-code-block-lowlight
```

```tsx
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const codeBlock = CodeBlockLowlight.configure({ lowlight: createLowlight(common) });
<Editor codeBlock={codeBlock} />
```

## [0.1.1] — 2026-04-21

### Added

- Link button in the formatting toolbar: set a link on the selection, edit an existing one
  with its current href pre-filled, and remove it by clearing the field
- Text alignment buttons (left, center, right) in the formatting toolbar
- `resolveAIFromEnv` and `resolveStorageFromEnv`, exported from the package root. `Editor`
  falls back to them when no `ai` or `storage` prop is given, so both can be configured
  from server-side environment variables. Neither reads `NEXT_PUBLIC_*` names
- Rephrase action in the floating AI toolbar, with the `ai.rephrase` translation key
- `themeMode` prop on `Toolbar` so active tool styling follows the resolved theme
- Next.js App Router and Pages Router examples: AI proxy API route, `.env.local.example`,
  and a client component split for the App Router write page
- README sections on environment-based AI and storage configuration, local development
  against this repo, publishing, and a pnpm versus npm troubleshooting note

### Changed

- Default theme preset is monochrome. Primary, secondary and accent are neutral slate
  tones in both light and dark instead of blue, violet and cyan
- Toolbar active-state colors are inlined from the resolved theme mode so host CSS cannot
  override them
- Floating AI toolbar no longer starts a rewrite when tone or intent changes. A rewrite
  runs only when Rewrite or Rephrase is pressed, and the selects stay in sync with
  `defaultTone` and `defaultIntent`
- Editor is created with `immediatelyRender: false` to avoid SSR hydration mismatches
- SEO signals are reported once on init through `onSignalsUpdate` instead of only after the
  first document change
- Alt text suggestions include the image URL alongside the surrounding document context
- S3 adapter falls back to `AWS_*` and `S3_BUCKET` environment variables when the config
  omits credentials, region or bucket, and builds public object URLs through one helper so
  `put` and `list` agree on the URL shape
- Upgraded to Vercel AI SDK v6 (`ai` ^6, `@ai-sdk/openai` ^3, `@ai-sdk/anthropic` ^3).
  Provider adapters use `maxOutputTokens` in place of the removed `maxTokens`
- Upgraded vitest to v4

### Fixed

- Image insert falls back to a data URL when a configured upload returns no result, instead
  of pointing at a local object URL that has already been revoked

## [0.1.0] — 2026-04-14

### Added

- Rich text editor based on Tiptap/ProseMirror with full formatting toolbar
- Inline AI rewriting with live streaming, tone/intent selection, and revert
- AI rewrite panel with diff preview (accept/reject flow)
- OpenAI and Anthropic provider adapters via Vercel AI SDK
- Progressive SEO signals — missing H1, heading hierarchy, empty alt text, weak title
- Pre-publish SEO analysis panel with readability scoring, keyword analysis, and SERP preview
- S3-compatible storage adapter (presigned URL + direct mode)
- Image optimization pipeline — client-side compression, responsive sizes, format detection
- AI-powered alt text suggestions for images
- Three theme presets — default, minimal, editorial
- Automatic dark mode detection (`prefers-color-scheme`, host CSS variables)
- Full i18n support with ~77 translation keys, locale-aware formatting
- Hooks API — `useEditor`, `useAIRewrite`, `useSEOAnalysis`, `useStorage`, `useTheme`
- Keyboard shortcuts — `Cmd+Shift+R` for rewrite, `Cmd+Shift+P` for pre-publish panel
- CSS variable–based theming with zero runtime CSS-in-JS
- Dual ESM/CJS build via tsup with full TypeScript declarations
- React 18 and 19 support
- Unit tests for core logic modules
- CI via GitHub Actions (Node 20/22 matrix, type check, test, build, bundle size)
- Documentation — getting started, configuration, hooks API
- React basic example (Vite)
