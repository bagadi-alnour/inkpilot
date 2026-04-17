# TypeScript guide

## Overview

`@writeflow/editor` is authored in TypeScript with strict typing across the public surface. Use **`strict`** mode in your `tsconfig` so optional props, discriminated unions, and event maps stay accurate as you upgrade.

## Exported types (package entry)

The following types are exported from `@writeflow/editor` (see `src/index.ts`):

**Editor**

- `EditorConfig`
- `EditorContent`
- `EditorInstance`
- `EditorProps`

**AI**

- `AIConfig`
- `AIProvider`
- `AITone`
- `AIIntent`
- `RewriteResult`
- `RewriteOptions`
- `DiffSegment`
- `AIProviderAdapter`

**Storage**

- `StorageConfig`
- `StorageProvider`
- `StorageAdapter`
- `UploadedFile`

**SEO**

- `SEOConfig`
- `SEOAnalysis`
- `SEOIssue`
- `SEOSuggestion`
- `SEOSignal`
- `SEOSignalType`
- `SERPPreviewData`

**Theme**

- `ThemeConfig`
- `ThemeMode`
- `ThemeColors`
- `ThemePreset`

**i18n**

- `I18nConfig`
- `TranslationStrings`
- `TranslationKey`

**Image**

- `ImageConfig`
- `ImageFormat`

**Events**

- `EditorEventMap`
- `EditorEventName`

Hook **return types** (`UseAIRewriteReturn`, `UseSEOAnalysisReturn`, etc.) are defined in the source files; they are not all re-exported from the main entry. Rely on inference, or declare small local aliases:

```typescript
import { useAIRewrite } from "@writeflow/editor";

type AIRewriteApi = ReturnType<typeof useAIRewrite>;
```

## Exported functions

- `createAIProvider`
- `createStorageAdapter`
- `computeDiff`
- `analyzeContent`
- `generateSERPPreview`

## Strict mode benefits

- Catches `undefined` `ai` / `storage` when hooks require config.
- Narrows `AIProvider` to `"openai" | "anthropic"`—typos fail at compile time.
- `TranslationKey` prevents invalid i18n keys.
- `EditorEventMap` indexes payloads by event name (see below).

## Generic patterns

**`AIProviderAdapter`** — Implement this interface if you integrate a custom LLM stack while keeping the same streaming contract:

```typescript
import type { AIProviderAdapter, RewriteParams, RestructureParams } from "@writeflow/editor";

const adapter: AIProviderAdapter = {
  async *rewrite(params: RewriteParams) {
    yield "chunk";
  },
  async *restructure(params: RestructureParams) {
    yield "<p>...</p>";
  },
  async suggestTitle(content: string) {
    return ["Title A", "Title B", "Title C"];
  },
  async suggestMeta(content: string) {
    return "Meta description";
  },
};
```

`createAIProvider(config)` only instantiates the built-in OpenAI and Anthropic adapters from `AIConfig`. Implementing `AIProviderAdapter` is for advanced cases (tests, forks, or custom tooling) that call the same methods outside the default `AIConfig` path.

## Type-safe event handlers

`EditorEventMap` lists event names and payload types. Handlers should respect the mapping:

```typescript
import type { EditorEventMap, EditorEventName } from "@writeflow/editor";

function handle<N extends EditorEventName>(
  event: N,
  payload: EditorEventMap[N],
) {
  if (event === "seo:analysis:complete") {
    console.log(payload.score);
  }
}
```

`EditorEvents` (in the internal types package) describes `on` / `off` / `emit` patterns if you bridge to an event emitter.

## Configuration typing

Compose props from exported config types for reusable setups:

```typescript
import type { EditorConfig, AIConfig, SEOConfig } from "@writeflow/editor";

const ai: AIConfig = { provider: "openai", apiKey: "" };
const seo: SEOConfig = { lightSignals: true };

const defaults: Pick<EditorConfig, "ai" | "seo"> = { ai, seo };
```

## Notes

- Internal packages (`@writeflow/types`, `@writeflow/core`, etc.) are implementation details; depend on `@writeflow/editor` for stable names.
- Run `npm run typecheck` in your app after major upgrades to catch breaking changes in exported types.
