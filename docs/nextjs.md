# Next.js integration

## Overview

The editor depends on browser APIs and Tiptap’s React bindings. In Next.js, render it inside a **client component**, load styles once, and keep **secrets on the server**. Use **dynamic import** if you need to avoid SSR touching `window` during the initial pass.

## App Router — client wrapper

Create a client-only shell and import it from a Server Component page.

```tsx
// app/write/WriteEditor.tsx
"use client";

import { Editor } from "@writeflow/editor";
import "@writeflow/editor/styles.css";
import type { AIConfig } from "@writeflow/editor";

const ai: AIConfig | undefined = process.env.NEXT_PUBLIC_OPENAI_KEY
  ? {
      provider: "openai",
      apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    }
  : undefined;

export function WriteEditor() {
  return (
    <Editor
      ai={ai}
      theme={{ mode: "auto" }}
      seo={{ lightSignals: true, prePublishPanel: true }}
      storage={{
        provider: "s3",
        bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
        region: process.env.NEXT_PUBLIC_AWS_REGION!,
        presignedUrlEndpoint: "/api/upload",
      }}
    />
  );
}
```

```tsx
// app/write/page.tsx
import { WriteEditor } from "./WriteEditor";

export default function Page() {
  return (
    <main>
      <WriteEditor />
    </main>
  );
}
```

Prefer server-held API keys: expose only session-based cookies to the client and call your Route Handler for AI if you extend beyond the bundled client flow.

## Pages Router

Same idea: mark the file with `"use client"` (Next 13+) or ensure the editor lives in a component that is not a server component. In `_app` or the page:

```tsx
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("../components/WriteEditor").then((m) => m.WriteEditor), {
  ssr: false,
  loading: () => <p>Loading editor…</p>,
});
```

## Server Actions for `onPublish`

`onPublish` runs in the browser when the user confirms. Call a Server Action from that handler so persistence and validation stay server-side.

```tsx
"use client";

import { useTransition } from "react";
import { Editor } from "@writeflow/editor";
import type { EditorContent, SEOAnalysis } from "@writeflow/editor";
import { publishPost } from "./actions";

export function WriteEditor() {
  const [isPending, startTransition] = useTransition();

  return (
    <Editor
      onPublish={(content, analysis) => {
        startTransition(async () => {
          await publishPost({
            html: content.html,
            seoScore: analysis.score,
          });
        });
      }}
    />
  );
}
```

```typescript
// actions.ts
"use server";

export async function publishPost(data: { html: string; seoScore: number }) {
  // validate session, write to DB, revalidate tags, etc.
}
```

## API route for presigned uploads

See [Storage](./storage.md) for a full `POST` handler. Place it under `app/api/upload/route.ts` (App Router) or `pages/api/upload.ts` (Pages Router) and point `storage.presignedUrlEndpoint` at that path.

## Environment variables

| Concern | Pattern |
| ------- | ------- |
| Public bucket name / region | `NEXT_PUBLIC_S3_BUCKET`, `NEXT_PUBLIC_AWS_REGION` |
| AI key for **dev-only** client tests | `NEXT_PUBLIC_OPENAI_KEY` (never real production secrets) |
| AWS signing credentials | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — **server only**, used inside Route Handlers |

## Dynamic import for SSR safety

If you see hydration or `window` errors, load the editor with `next/dynamic` and `{ ssr: false }` or lazy `import()` inside `useEffect`. The `"use client"` boundary is usually enough for App Router.

## Notes

- Import `@writeflow/editor/styles.css` once in the client bundle (layout or the client component).
- Keep `presignedUrlEndpoint` as a same-origin path in production to simplify CORS and cookies.
