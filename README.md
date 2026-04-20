# WriteFlow

AI-powered writing infrastructure for developers. Drop a rich text editor with inline AI rewriting, progressive SEO signals, image optimization, and BYO storage into any React app.

```bash
npm install @writeflowhq/writeflow
```

```tsx
import { Editor } from "@writeflowhq/writeflow";
import "@writeflowhq/writeflow/styles.css";

function App() {
  return (
    <Editor
      ai={{ provider: "openai", apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! }}
      theme={{ mode: "auto" }}
      onChange={(content) => console.log(content.wordCount)}
    />
  );
}
```

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Editor Component](#editor-component)
- [AI Rewriting](#ai-rewriting)
- [SEO Signals](#seo-signals)
- [Storage](#storage)
- [Image Optimization](#image-optimization)
- [Theming](#theming)
- [Internationalization](#internationalization)
- [Hooks API](#hooks-api)
- [Next.js Integration](#nextjs-integration)
- [TypeScript](#typescript)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Reference](#api-reference)

---

## Installation

```bash
npm install @writeflowhq/writeflow
# or
yarn add @writeflowhq/writeflow
# or
pnpm add @writeflowhq/writeflow
```

**Peer dependencies:** React 18+ or 19+.

```bash
npm install react react-dom
```

---

## Quick Start

Import the `<Editor />` component and the stylesheet:

```tsx
import { Editor } from "@writeflowhq/writeflow";
import "@writeflowhq/writeflow/styles.css";

function WritingPage() {
  return (
    <Editor
      ai={{
        provider: "openai",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
      }}
      storage={{
        provider: "s3",
        bucket: "my-uploads",
        region: "us-east-1",
        presignedUrlEndpoint: "/api/upload",
      }}
      theme={{ mode: "auto" }}
      seo={{ lightSignals: true, prePublishPanel: true }}
      onChange={(content) => {
        console.log(content.html, content.markdown, content.wordCount);
      }}
      onPublish={(content, analysis) => {
        saveToDatabase(content.html);
      }}
    />
  );
}
```

The editor works with zero config — every option is optional. Add features incrementally.

---

## Editor Component

### Props

```tsx
interface EditorProps {
  // Feature configuration
  ai?: AIConfig;
  storage?: StorageConfig;
  theme?: ThemeConfig;
  seo?: SEOConfig;
  image?: ImageConfig;
  i18n?: I18nConfig;
  locale?: string;

  // Content
  content?: Partial<EditorContent>;
  onChange?: (content: EditorContent) => void;
  onPublish?: (content: EditorContent, analysis: SEOAnalysis) => void;

  // Behavior
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}
```

### Content Output

Every `onChange` callback receives a typed `EditorContent` object:

```tsx
interface EditorContent {
  html: string;                    // Clean semantic HTML
  markdown: string;                // Markdown conversion
  json: Record<string, unknown>;   // ProseMirror JSON
  text: string;                    // Plain text
  wordCount: number;               // Word count
  readingTime: number;             // Estimated reading time (minutes)
}
```

### Read-Only Mode

```tsx
<Editor content={{ html: articleHtml }} readOnly />
```

---

## AI Rewriting

The core feature. Select text, click "Rewrite," and see an inline diff preview with streaming AI suggestions.

### Configuration

```tsx
<Editor
  ai={{
    provider: "openai",       // "openai" | "anthropic"
    apiKey: "sk-...",
    model: "gpt-4o-mini",     // Optional: override default model
    baseURL: "https://...",   // Optional: custom API endpoint
    defaultTone: "casual",    // "formal" | "casual" | "persuasive"
    defaultIntent: "clarify", // "simplify" | "expand" | "clarify"
    preserveMeaning: true,    // Keep original meaning (default: true)
    onRewrite: (result) => {
      console.log(result.original, result.rewritten, result.accepted);
    },
  }}
/>
```

### How It Works

1. **Select text** in the editor
2. A floating toolbar appears with "Rewrite" and tone/intent options
3. Click **Rewrite** — tokens stream in and a diff preview shows inline (deletions in red, insertions in green)
4. Press **Enter** to accept or **Esc** to reject

### Supported Providers

| Provider | Config | Default Model |
|----------|--------|---------------|
| OpenAI | `provider: "openai"` | `gpt-4o-mini` |
| Anthropic | `provider: "anthropic"` | `claude-sonnet-4-20250514` |

### API Key Security

Never expose API keys in client-side code for production. Use a proxy:

```tsx
<Editor
  ai={{
    provider: "openai",
    apiKey: "proxy-key",
    baseURL: "/api/ai-proxy",
  }}
/>
```

Then proxy requests through your backend.

---

## SEO Signals

WriteFlow provides two levels of SEO assistance:

### Light Signals (During Writing)

Subtle, non-blocking structural hints that appear while writing. No AI calls, zero performance cost.

| Signal | Behavior |
|--------|----------|
| Missing H1 | Small indicator if no H1 heading exists |
| Weak title | Dashed underline if H1 is too short/long |
| Heading hierarchy | Color shift if headings skip levels (H1 → H3) |
| Empty alt text | Badge on images without alt text |

```tsx
<Editor seo={{ lightSignals: true }} />
```

### Pre-Publish Panel (Before Publishing)

Full content analysis activated when the user clicks Publish. Runs readability scoring, keyword analysis, and AI-powered title/meta suggestions.

```tsx
<Editor
  seo={{
    lightSignals: true,
    prePublishPanel: true,
    targetKeywords: ["react editor", "ai writing"],
    onAnalysis: (analysis) => {
      console.log(analysis.score, analysis.issues, analysis.suggestions);
    },
  }}
  onPublish={(content, analysis) => {
    if (analysis.score > 70) {
      publishArticle(content);
    }
  }}
/>
```

The panel includes:
- Overall SEO score (0–100)
- Issues grouped by severity
- AI-generated title alternatives and meta descriptions (when AI is configured)
- SERP preview
- Non-blocking — publishing is always available regardless of score

---

## Storage

Bring your own storage for image uploads. S3-compatible storage (AWS S3, Cloudflare R2) is supported.

### Presigned URLs (Recommended)

The safest approach — no credentials in the browser:

```tsx
<Editor
  storage={{
    provider: "s3",
    bucket: "my-bucket",
    region: "us-east-1",
    presignedUrlEndpoint: "/api/upload",
  }}
/>
```

Your backend endpoint receives `{ filename, contentType, size }` and returns `{ uploadUrl, publicUrl, key }`:

```ts
// app/api/upload/route.ts (Next.js example)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  const { filename, contentType } = await req.json();
  const key = `uploads/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  const publicUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;

  return Response.json({ uploadUrl, publicUrl, key });
}
```

### Direct Credentials (Server-Side Only)

For API routes, server actions, or SSR contexts only. Never use in client-side code.

```tsx
<Editor
  storage={{
    provider: "s3",
    bucket: "my-bucket",
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }}
/>
```

### Upload Callback

```tsx
<Editor
  storage={{
    provider: "s3",
    bucket: "my-bucket",
    presignedUrlEndpoint: "/api/upload",
    onUpload: (file) => {
      console.log(file.url, file.size, file.mimeType);
    },
  }}
/>
```

---

## Image Optimization

Images dropped or pasted into the editor are automatically processed:

- **Compression** — client-side via web worker (non-blocking)
- **Responsive sizes** — generates 480w, 768w, 1024w, 1440w variants
- **Format detection** — WebP/AVIF support detection
- **Lazy loading** — added automatically

### Configuration

```tsx
<Editor
  image={{
    maxFileSize: 1024 * 1024,           // 1MB max (default)
    maxWidth: 2400,                      // Max dimension (default)
    quality: 0.8,                        // Compression quality (default)
    responsiveSizes: [480, 768, 1024],   // Custom breakpoints
    autoCompress: true,                  // Enable compression (default)
  }}
/>
```

When storage is configured, processed images upload automatically and the editor inserts the remote URL. Without storage, images use local blob URLs.

---

## Theming

WriteFlow uses CSS variables for all visual styling. Three built-in presets, dark/light mode support, and full customization.

### Mode

```tsx
<Editor theme={{ mode: "auto" }} />   // Follows system preference
<Editor theme={{ mode: "dark" }} />
<Editor theme={{ mode: "light" }} />
```

### Presets

```tsx
<Editor theme={{ preset: "default" }} />     // Clean, neutral (Notion-like)
<Editor theme={{ preset: "minimal" }} />     // Reduced chrome, focus on content
<Editor theme={{ preset: "editorial" }} />   // Serif headings, editorial feel
```

### Custom Colors

```tsx
<Editor
  theme={{
    mode: "dark",
    colors: {
      primary: "#6366f1",
      background: "#0f172a",
      foreground: "#e2e8f0",
      accent: "#818cf8",
      border: "#334155",
      muted: "#1e293b",
      mutedForeground: "#94a3b8",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#22c55e",
    },
  }}
/>
```

### CSS Variables

All styling uses `--wf-*` CSS variables. Override them in your own CSS:

```css
.writeflow-editor {
  --wf-color-primary: #6366f1;
  --wf-color-bg: #ffffff;
  --wf-color-fg: #1e293b;
  --wf-font-body: "Inter", sans-serif;
  --wf-font-heading: "Inter", sans-serif;
  --wf-radius-md: 6px;
}
```

### Auto-Detection

In `auto` mode, the editor:
1. Checks `prefers-color-scheme` media query
2. Looks for `data-theme` or `class="dark"` on `<html>` / `<body>`
3. Falls back to the `default` preset in light mode

---

## Internationalization

All UI strings are translatable. Default language is English.

### Override Strings

```tsx
<Editor
  locale="es"
  i18n={{
    translations: {
      "toolbar.bold": "Negrita",
      "toolbar.italic": "Cursiva",
      "ai.rewrite": "Reescribir con IA",
      "ai.accept": "Aceptar",
      "ai.reject": "Rechazar",
      "seo.panel.title": "Revisión de contenido",
      "seo.panel.publish": "Publicar",
    },
  }}
/>
```

See the full list of translation keys in the [`TranslationStrings`](#translationstrings) type.

---

## Hooks API

For developers who need granular control beyond the `<Editor />` component.

### useWriteFlowEditor

```tsx
import { useWriteFlowEditor } from "@writeflowhq/writeflow";

function CustomEditor() {
  const { editor, content, signals, setContent, isEmpty } = useWriteFlowEditor({
    ai: { provider: "openai", apiKey: "..." },
    seo: { lightSignals: true },
    placeholder: "Start writing...",
    onChange: (content) => console.log(content),
  });

  return <EditorContent editor={editor} />;
}
```

### useAIRewrite

```tsx
import { useAIRewrite } from "@writeflowhq/writeflow";

const {
  rewrite,        // (options?) => void — trigger a rewrite
  liveRewrite,    // (tone, intent) => void — live inline rewrite
  revert,         // () => void — revert live changes
  isRewriting,    // boolean
  isLive,         // boolean — live mode active
  result,         // RewriteResult | null
  diff,           // DiffSegment[]
  streamedText,   // string — accumulated streamed text
  accept,         // () => void
  reject,         // () => void
  abort,          // () => void
} = useAIRewrite(editor, aiConfig);
```

### useSEOAnalysis

```tsx
import { useSEOAnalysis } from "@writeflowhq/writeflow";

const {
  signals,       // SEOSignal[] — light signals
  analysis,      // SEOAnalysis | null
  isAnalyzing,   // boolean
  runAnalysis,   // () => Promise<void>
} = useSEOAnalysis(editor, seoConfig, aiConfig, signals);
```

### useStorage

```tsx
import { useStorage } from "@writeflowhq/writeflow";

const {
  upload,       // (file, path?) => Promise<UploadedFile | null>
  isUploading,  // boolean
  progress,     // number (0–100)
  lastUpload,   // UploadedFile | null
  error,        // string | null
} = useStorage(storageConfig);
```

### useTheme

```tsx
import { useTheme } from "@writeflowhq/writeflow";

const {
  theme,   // ResolvedTheme — resolved mode, colors, preset
} = useTheme(themeConfig, containerRef);
```

---

## Next.js Integration

### App Router

```tsx
// app/write/page.tsx
"use client";

import { Editor } from "@writeflowhq/writeflow";
import "@writeflowhq/writeflow/styles.css";

export default function WritePage() {
  return (
    <Editor
      ai={{
        provider: "openai",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
      }}
      storage={{
        provider: "s3",
        bucket: "my-bucket",
        presignedUrlEndpoint: "/api/upload",
      }}
      theme={{ mode: "auto" }}
      seo={{ lightSignals: true, prePublishPanel: true }}
      onPublish={async (content) => {
        await fetch("/api/articles", {
          method: "POST",
          body: JSON.stringify({ html: content.html }),
        });
      }}
    />
  );
}
```

The `<Editor />` is a client component. In App Router, add `"use client"` to the page or wrap it in a client component.

### Pages Router

```tsx
// pages/write.tsx
import { Editor } from "@writeflowhq/writeflow";
import "@writeflowhq/writeflow/styles.css";

export default function WritePage() {
  return (
    <Editor
      ai={{ provider: "openai", apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY! }}
      storage={{ provider: "s3", bucket: "my-bucket", presignedUrlEndpoint: "/api/upload" }}
      theme={{ mode: "dark" }}
      onPublish={async (content) => {
        await fetch("/api/articles", {
          method: "POST",
          body: JSON.stringify({ html: content.html }),
        });
      }}
    />
  );
}
```

### Presigned Upload API Route

```ts
// app/api/upload/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const { filename, contentType, size } = await req.json();
  const key = `uploads/${Date.now()}-${filename}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );

  return Response.json({
    uploadUrl,
    publicUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
    key,
  });
}
```

---

## TypeScript

WriteFlow is written in TypeScript with `strict: true`. All types are exported:

```tsx
import type {
  EditorConfig,
  EditorContent,
  AIConfig,
  AIProvider,
  AITone,
  AIIntent,
  RewriteResult,
  StorageConfig,
  StorageAdapter,
  UploadedFile,
  SEOConfig,
  SEOAnalysis,
  SEOIssue,
  SEOSuggestion,
  SEOSignal,
  ThemeConfig,
  ThemeMode,
  ThemeColors,
  ImageConfig,
  I18nConfig,
  TranslationStrings,
  TranslationKey,
  DiffSegment,
  SERPPreviewData,
} from "@writeflowhq/writeflow";
```

The public API surface has zero `any`. Full autocomplete and compile-time validation.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| AI Rewrite | `Cmd/Ctrl + Shift + R` |
| Publish / Review | `Cmd/Ctrl + Shift + P` |
| Accept rewrite | `Enter` |
| Reject rewrite | `Esc` |
| Bold | `Cmd/Ctrl + B` |
| Italic | `Cmd/Ctrl + I` |
| Underline | `Cmd/Ctrl + U` |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` |

---

## API Reference

### Utility Exports

For advanced use cases, these are available as standalone imports:

```tsx
import {
  createAIProvider,       // (config: AIConfig) => AIProviderAdapter
  createStorageAdapter,   // (config: StorageConfig) => StorageAdapter
  computeDiff,            // (original, rewritten) => DiffSegment[]
  analyzeContent,         // (editor, seoConfig, aiProvider?) => SEOAnalysis
  generateSERPPreview,    // (title, description, url?) => SERPPreviewData
} from "@writeflowhq/writeflow";
```

### AIConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `"openai" \| "anthropic"` | — | **Required.** AI provider |
| `apiKey` | `string` | — | **Required.** API key |
| `model` | `string` | Provider default | Model override |
| `baseURL` | `string` | Provider default | Custom API endpoint |
| `defaultTone` | `"formal" \| "casual" \| "persuasive"` | `"casual"` | Default rewrite tone |
| `defaultIntent` | `"simplify" \| "expand" \| "clarify"` | `"clarify"` | Default rewrite intent |
| `preserveMeaning` | `boolean` | `true` | Preserve original meaning |
| `onRewrite` | `(result: RewriteResult) => void` | — | Callback after rewrite |

### StorageConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `"s3"` | — | **Required.** Storage provider |
| `bucket` | `string` | — | **Required.** Bucket name |
| `region` | `string` | — | AWS region |
| `endpoint` | `string` | — | Custom endpoint (e.g., R2) |
| `basePath` | `string` | — | Key prefix for uploads |
| `presignedUrlEndpoint` | `string` | — | Backend URL for presigned uploads |
| `accessKeyId` | `string` | — | Direct credentials (server-side only) |
| `secretAccessKey` | `string` | — | Direct credentials (server-side only) |
| `onUpload` | `(file: UploadedFile) => void` | — | Callback after upload |

### SEOConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lightSignals` | `boolean` | `true` | Show structural SEO hints while writing |
| `prePublishPanel` | `boolean` | `true` | Show analysis panel on publish |
| `targetKeywords` | `string[]` | — | Keywords for density analysis |
| `locale` | `string` | — | Locale for analysis |
| `onAnalysis` | `(analysis: SEOAnalysis) => void` | — | Callback after analysis |

### ThemeConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `"light" \| "dark" \| "auto"` | `"auto"` | Color mode |
| `preset` | `"default" \| "minimal" \| "editorial"` | `"default"` | Theme preset |
| `colors` | `Partial<ThemeColors>` | — | Custom color overrides |

### ImageConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxFileSize` | `number` | `1048576` (1MB) | Max file size in bytes |
| `maxWidth` | `number` | `2400` | Max width in pixels |
| `quality` | `number` | `0.8` | Compression quality (0–1) |
| `responsiveSizes` | `number[]` | `[480, 768, 1024, 1440]` | Responsive breakpoints |
| `autoCompress` | `boolean` | `true` | Auto-compress on upload |

### TranslationStrings

Full list of translatable keys:

**Toolbar:** `toolbar.bold`, `toolbar.italic`, `toolbar.underline`, `toolbar.strikethrough`, `toolbar.heading1`, `toolbar.heading2`, `toolbar.heading3`, `toolbar.bulletList`, `toolbar.orderedList`, `toolbar.blockquote`, `toolbar.codeBlock`, `toolbar.link`, `toolbar.image`, `toolbar.alignLeft`, `toolbar.alignCenter`, `toolbar.alignRight`, `toolbar.undo`, `toolbar.redo`

**AI:** `ai.rewrite`, `ai.rewriting`, `ai.accept`, `ai.reject`, `ai.options`, `ai.tone`, `ai.intent`, `ai.tone.formal`, `ai.tone.casual`, `ai.tone.persuasive`, `ai.intent.simplify`, `ai.intent.expand`, `ai.intent.clarify`, `ai.preserveMeaning`, `ai.restructure`, `ai.restructuring`

**SEO:** `seo.missingH1`, `seo.weakTitle`, `seo.headingHierarchy`, `seo.emptyAlt`, `seo.panel.title`, `seo.panel.score`, `seo.panel.issues`, `seo.panel.suggestions`, `seo.panel.publish`, `seo.panel.publishAnyway`, `seo.panel.close`, `seo.panel.apply`, `seo.panel.dismiss`, `seo.serp.title`, `seo.serp.preview`

**Image:** `image.upload`, `image.uploading`, `image.dropHere`, `image.altText`, `image.suggestAlt`

**General:** `general.loading`, `general.error`, `general.cancel`, `general.save`, `general.placeholder`

---

## License

MIT
