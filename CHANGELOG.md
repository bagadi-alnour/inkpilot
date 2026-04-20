# Changelog

All notable changes to `@inkpilot/editor` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
