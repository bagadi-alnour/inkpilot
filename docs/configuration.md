# Configuration

All props of `<Editor />`. Every one is optional.

```ts
interface EditorProps {
  ai?: AIConfig;
  image?: ImageConfig;
  seo?: SEOConfig;
  theme?: ThemeConfig;
  i18n?: I18nConfig;
  /** UI language, and the content language unless `seo.locale` is set. */
  locale?: string;

  content?: { html?: string };
  onChange?: (content: EditorContent) => void;   // debounced 300 ms

  defaultMeta?: Partial<PublishMeta>;             // { title, description, slug }
  onMetaChange?: (meta: PublishMeta) => void;
  onPublish?: (payload: PublishPayload) => void;  // { content, meta, report }

  codeBlock?: Node;                               // a Tiptap node named `codeBlock`

  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}
```

## `ai`

Either an endpoint (usually a `createInkpilotHandler` route) or your own transport:

```ts
type AIConfig =
  | { endpoint: string; headers?: HeadersInit | (() => HeadersInit) } & AIBehaviour
  | { transport: InkpilotTransport } & AIBehaviour;

interface AIBehaviour {
  defaultTone?: 'formal' | 'casual' | 'persuasive';   // default 'casual'
  defaultIntent?: 'simplify' | 'expand' | 'clarify';  // default 'clarify'
  preserveMeaning?: boolean;                          // default true
  onRewrite?: (result: RewriteResult) => void;        // accepted or rejected proposals
}
```

`headers` can be a function, which is handy for a fresh auth token per request. See [AI](ai.md).

## `image`

```ts
interface ImageConfig {
  upload?: ImageUploader;           // without it, images become data URLs
  maxFileSize?: number;             // compress above this, default 1 MB
  maxWidth?: number;                // scale down to this, default 2400
  quality?: number;                 // JPEG/WebP quality, default 0.82
  autoCompress?: boolean;           // default true
  autoAltText?: boolean;            // default true when AI is configured
  onUploadError?: (error: Error, file: File) => void;
}
```

See [Images](images.md).

## `seo`

```ts
interface SEOConfig {
  liveSignals?: boolean;            // underlines + toolbar score, default true
  prePublishPanel?: boolean;        // review panel before onPublish, default true
  keywords?: string[];
  locale?: string;                  // content language, defaults to `locale`
  baseUrl?: string;                 // for the search preview, e.g. 'https://example.com/blog/'
  rules?: Partial<SEORuleOptions>;  // thresholds, see SEO docs
}
```

With `prePublishPanel: false`, the publish shortcut calls `onPublish` directly, and the description checks are skipped because nothing edits the description.

## `codeBlock`

Code blocks are plain `<pre><code>` by default, so the client bundle carries no highlighter. For syntax highlighting, pass a code block node of your own. Register only the languages you write about; lowlight's `common` set alone is about 50 kB gzipped.

```bash
npm install lowlight @tiptap/extension-code-block-lowlight
```

```tsx
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css'; // any highlight.js theme colors the tokens

// Create it once, outside the component: the editor reads it when it's created.
const codeBlock = CodeBlockLowlight.configure({ lowlight: createLowlight({ typescript, bash }) });

<Editor codeBlock={codeBlock} />
```

The node must keep the name `codeBlock`. The toolbar button, the SEO checks (which skip code) and the rewrite guard (which refuses code) look for that name.

## Content output

`onChange` and `onPublish` receive:

```ts
interface EditorContent {
  html: string;
  markdown: string;
  json: Record<string, unknown>;   // ProseMirror JSON
  text: string;                    // blocks separated by blank lines
  wordCount: number;
  readingTime: number;             // minutes at 238 wpm
}
```
