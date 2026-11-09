# Getting started

## 1. Install

```bash
npm install @inkpilot/editor
npm install ai zod @ai-sdk/anthropic   # server side; any AI SDK provider works
```

`ai` and `zod` are optional peer dependencies. You only need them where you mount the server handler.

## 2. Add the AI route

The editor never calls a model provider directly. It POSTs to a route you own:

```ts
// app/api/inkpilot/route.ts (Next.js App Router)
import { createInkpilotHandler } from '@inkpilot/editor/server';
import { anthropic } from '@ai-sdk/anthropic';

export const POST = createInkpilotHandler({
  model: anthropic('claude-sonnet-5-5'),
  authorize: async (request) => Boolean(await getSession(request)),
});
```

Put the provider key in a server-only env var (`ANTHROPIC_API_KEY`). Never use a `NEXT_PUBLIC_` or `VITE_` prefix for it, because those get bundled into the browser.

## 3. Render the editor

```tsx
'use client';
import { Editor } from '@inkpilot/editor';
import '@inkpilot/editor/styles.css';

export function Write() {
  return (
    <Editor
      ai={{ endpoint: '/api/inkpilot' }}
      seo={{ keywords: ['next.js build time'] }}
      onPublish={({ content, meta, report }) => console.log(content.html, meta, report.score)}
    />
  );
}
```

Every prop is optional. Without `ai`, the editor still runs every check, but it hides AI fixes and rewrites.

## 4. Store images (optional)

Without an uploader, images are embedded as data URLs and the editor flags them. To store them:

```tsx
import { presignedUpload } from '@inkpilot/editor';

<Editor image={{ upload: presignedUpload('/api/upload') }} />
```

See [Images](images.md) for the endpoint contract and custom uploaders.

## What to try

- Write a long sentence. It gets a wavy underline and the toolbar score drops. Hover it and choose Fix with AI.
- Select text and choose Rewrite with AI from the bubble menu.
- Click the score to review checks, write the SEO title and description, and publish.
