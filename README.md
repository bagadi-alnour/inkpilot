# Inkpilot

A React editor where the SEO checks and the AI work together. Inkpilot underlines what's wrong while you write. "Fix with AI" proposes a change in place. You accept it as one undoable edit and the check runs again. Title, description, slug and alt text come out ready to publish.

It's free and MIT licensed. You bring the model and the image storage, and Inkpilot never needs your API keys in the browser.

```bash
npm install @inkpilot/editor
# for the server route:
npm install ai zod @ai-sdk/anthropic   # or any AI SDK provider
```

```tsx
// app/write/page.tsx (client component)
'use client';
import { Editor, presignedUpload } from '@inkpilot/editor';
import '@inkpilot/editor/styles.css';

export default function Write() {
  return (
    <Editor
      ai={{ endpoint: '/api/inkpilot' }}
      image={{ upload: presignedUpload('/api/upload') }}
      seo={{ keywords: ['next.js build time'], baseUrl: 'https://example.com/blog/' }}
      onPublish={({ content, meta, report }) => save({ html: content.html, ...meta, score: report.score })}
    />
  );
}
```

```ts
// app/api/inkpilot/route.ts
import { createInkpilotHandler } from '@inkpilot/editor/server';
import { anthropic } from '@ai-sdk/anthropic';

export const POST = createInkpilotHandler({
  model: anthropic('claude-sonnet-5-5'),
  authorize: async (request) => Boolean(await getSession(request)),
});
```

Requires React 18 or 19. The server entry requires Node 22+ (or an edge runtime) and AI SDK 7.

## What you get

**Live checks.** One engine runs a few hundred milliseconds after you stop typing. It flags long sentences, dense paragraphs, a missing or duplicate H1, skipped heading levels, title and description length, images without alt text, where your keywords appear and how often, and (for English) overall reading ease. Each issue points at the exact text, so it's underlined in place and the toolbar shows a score.

**Fix with AI.** Hover an underlined issue and choose Fix with AI. The proposal streams in next to the original as tracked changes: old text struck through, new text after it. Enter accepts, Esc rejects. Accepting is a single undo step. Nothing changes in your document until you accept.

**Rewrite a selection.** Select text, pick a tone (formal, casual, persuasive) and an intent (simplify, expand, clarify). Same preview, same accept/reject.

**Review and publish.** Click the score to open the publish panel. It lists every check with Fix, Suggest or Show. You get an SEO title and description with AI suggestions, a slug that follows the title until you edit it, and a search-result preview. `onPublish` receives the content, the metadata and an analysis of that exact content.

**Images.** Drop, paste or pick an image. You see a preview right away while your uploader stores it. Undo and redo stay correct while an upload is in flight. Large images are scaled and re-encoded first, and the AI can write the alt text.

## How it fits together

```
Browser                                    Your server
<Editor ai={{ endpoint }}>  ── POST ──▶    createInkpilotHandler({ model, authorize })
  task + content (HTML subset)               prompts live here, keys live here
  ◀── NDJSON: delta… then done | error ──    any AI SDK model
```

The client sends a task (`fix`, `rewrite`, `titles`, `descriptions`, `alt`) and the content. The prompts live on the server. Streams end with an explicit `done` event, and a stream that stops without one is shown as failed, never as a finished proposal.

Content travels as a restricted HTML subset, not Markdown, because Markdown can't represent text color or alignment. Model output is parsed in an inert document, checked against the editor schema and allowed tags, and links go through the same safety check as the link button. A proposal with a `javascript:` link, an image or a script fails validation and can't be accepted.

## Security

The endpoint spends your tokens. Fixed tasks and server-side prompts narrow what it does, but they don't stop abuse. Anyone who can reach it can send their own text, and that text may contain instructions aimed at the model. So:

- `authorize` is required. `authorize: 'public'` exists for demos and is spelled out on purpose.
- Rate-limit the route at your host (middleware, gateway, or a store like Upstash). Inkpilot doesn't ship a limiter.
- Inputs are size-limited (`limits.maxInputChars`, `limits.maxImageBytes`), and output tokens are capped per task.
- When the browser cancels, the model call is aborted too.
- The server never fetches URLs on the client's behalf. Alt text receives image bytes from the browser.

## The score

The score (0 to 100) says how well the content meets Inkpilot's checks. It is not a ranking prediction. Length limits are guidance: Google documents no fixed title or description length, and how much shows depends on the device. That's why length findings are `info`, and you can change every threshold with `seo.rules`. Fix prompts aim at readers (shorter sentences, a clearer intro, a keyword where it reads naturally), never at the number.

## Docs

- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md): every prop
- [AI](docs/ai.md): server handler, protocol, custom transports
- [Images](docs/images.md): uploaders, presigned URLs, alt text
- [SEO](docs/seo.md): checks, thresholds, fixes, publishing
- [Hooks](docs/hooks.md): building your own UI
- [Next.js](docs/nextjs.md): App Router, Pages Router, edge
- [Theming](docs/theming.md), [Internationalization](docs/i18n.md), [TypeScript](docs/typescript.md)

Examples: [`examples/nextjs-app-router`](examples/nextjs-app-router) (handler, presigned uploads), [`examples/nextjs-pages-router`](examples/nextjs-pages-router) (edge route), [`examples/react-basic`](examples/react-basic) (Vite dev-server middleware). Without an API key they use a scripted demo model, so you can try the whole flow offline.

## Keyboard

| Keys | Action |
|---|---|
| Cmd/Ctrl + Alt + R | Rewrite the selection |
| Cmd/Ctrl + Alt + P | Open the publish panel |
| Enter / Esc | Accept / reject a ready proposal |

## Upgrading from 0.1

0.2 is a breaking release. See the [migration guide in the changelog](CHANGELOG.md#migrating-from-01).

## Developing

```bash
npm install
npm test               # vitest
npm run typecheck && npm run lint
npm run build && npm run check:bundle   # client/server import boundary + gzip budget
```

Point an example at your checkout with `"@inkpilot/editor": "file:../../"` and run `npm run build` after changing the package.

MIT licensed.
