# AI provider setup

## Overview

`@writeflow/editor` powers inline rewriting with the [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`). You choose a provider, pass an API key, and optionally tune model, tone, intent, and meaning preservation. Rewrites stream into the UI; users accept or reject the diff.

## Supported providers

| Provider   | `AIConfig.provider` | Default model              |
| ---------- | ------------------- | -------------------------- |
| OpenAI     | `"openai"`          | `gpt-4o-mini`              |
| Anthropic  | `"anthropic"`       | `claude-sonnet-4-20250514` |

Override the default with `model`. Use `baseURL` for proxies or compatible endpoints.

## `AIConfig`

```typescript
import type { AIConfig } from "@writeflow/editor";

const ai: AIConfig = {
  provider: "openai", // or "anthropic"
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
  model: "gpt-4o-mini", // optional; provider defaults apply when omitted
  baseURL: undefined, // optional custom API base URL
  defaultTone: "formal", // "formal" | "casual" | "persuasive"
  defaultIntent: "clarify", // "simplify" | "expand" | "clarify"
  preserveMeaning: true, // steer rewrite toward same factual content
  onRewrite: (result) => {
    // optional: fired when a rewrite completes
  },
};
```

Pass `ai` to `<Editor />` or to `useAIRewrite` (see below).

## Prompt behavior

Built-in prompts combine your selection with surrounding context and map **tone** and **intent** to fixed instruction text (professional voice, simplification, etc.). There is no `AIConfig` field for arbitrary prompt strings; behavior is controlled through `defaultTone`, `defaultIntent`, `preserveMeaning`, and per-invocation options on the hook. For enterprise-only wording or guardrails, keep sensitive logic on the server and call your own API from a route or action, then feed results into the document outside the default flow if needed.

## Security

- **Never ship provider API keys in client bundles in production.** Anything in browser JavaScript is visible.
- Prefer **server-side** execution: Route Handlers, Server Actions, or a backend that holds the secret and streams or returns text.
- If you must pass a key to the bundled editor in development only, use framework env vars and restrict production builds so keys are not embedded.

## Environment variables

Patterns (names are conventions—wire them to `AIConfig.apiKey` in your app):

**Vite**

```bash
# .env
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

**Next.js**

```bash
# .env.local — only NEXT_PUBLIC_* is exposed to the browser (still avoid in prod for real secrets)
NEXT_PUBLIC_OPENAI_KEY=sk-...
```

```typescript
const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;
```

For production, omit `NEXT_PUBLIC_` from secrets and resolve the key only in server code.

## `useAIRewrite`

Use the headless hook when you build your own toolbar or embed Tiptap yourself.

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import { useAIRewrite } from "@writeflow/editor";
import type { AIConfig } from "@writeflow/editor";

const ai: AIConfig = {
  provider: "openai",
  apiKey: "...", // server-provided or dev-only
};

function CustomSurface({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const aiRewrite = useAIRewrite(editor, ai);

  return (
    <>
      <button
        type="button"
        disabled={!editor || aiRewrite.isRewriting}
        onClick={() =>
          aiRewrite.rewrite({
            tone: "casual",
            intent: "simplify",
            preserveMeaning: true,
          })
        }
      >
        Rewrite selection
      </button>
      {/* Panel UI: aiRewrite.diff, aiRewrite.streamedText, aiRewrite.result */}
      <button type="button" onClick={aiRewrite.accept}>Accept</button>
      <button type="button" onClick={aiRewrite.reject}>Reject</button>
    </>
  );
}
```

The hook also exposes **live rewrite** helpers (`liveRewrite`, `revert`, `isLive`) used by the built-in floating toolbar for streaming replacements as tokens arrive.

## Notes

- `createAIProvider(config)` is exported for advanced composition; typical apps only pass `AIConfig` into `<Editor />` or `useAIRewrite`.
- Rewrites use `streamText` from the AI SDK with bounded `maxTokens` and temperature per adapter implementation.
