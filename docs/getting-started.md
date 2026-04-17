# Getting Started

## Installation

```bash
npm install @writeflow/editor
```

## Quick Start (React)

```tsx
import { Editor } from "@writeflow/editor";
import "@writeflow/editor/styles.css";

function App() {
  return (
    <Editor
      ai={{
        provider: "openai",
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
      }}
      theme={{ mode: "auto" }}
      seo={{ lightSignals: true, prePublishPanel: true }}
      onChange={(content) => console.log(content.wordCount, "words")}
      onPublish={(content, analysis) => {
        console.log("Publishing with SEO score:", analysis.score);
      }}
    />
  );
}
```

## Quick Start (Next.js App Router)

```tsx
// app/write/page.tsx
import { Editor } from "@writeflow/editor";
import "@writeflow/editor/styles.css";

export default function WritePage() {
  return (
    <main>
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
        seo={{ lightSignals: true }}
      />
    </main>
  );
}
```

## What You Get

- Rich text editing (bold, italic, headings, lists, code blocks, images, links)
- **Inline AI rewriting** — select text, click "Rewrite", accept or reject
- **Progressive SEO signals** — light warnings during writing, full analysis before publish
- **Image optimization** — automatic compression on upload
- **Dark mode** — auto-detects or configure manually
- **Fully typed** — zero `any` in the public API, full autocomplete

## Next Steps

- [Configuration](./configuration.md) — all config options
- [AI Setup](./ai.md) — provider configuration and prompt customization
- [Storage](./storage.md) — S3 setup with presigned URLs
- [Theming](./theming.md) — presets, custom colors, CSS variables
- [Hooks API](./hooks.md) — advanced usage with individual hooks
