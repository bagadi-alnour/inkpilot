# Changelog

All notable changes to `@inkpilot/editor` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Toolbar link button now normalises the typed href and only accepts `http`, `https`,
  `mailto` and `tel`. Control characters are stripped first, scheme-less input is promoted
  to `https`, and anything else (such as `javascript:` or `data:`) is rejected instead of
  being handed to `setLink`

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
