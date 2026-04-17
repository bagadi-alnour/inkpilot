# SEO features

## Overview

SEO is split into two layers: **light signals** while editing (fast, local rules) and a **pre-publish panel** with full analysis (readability, keywords when configured, SERP-style preview). Light signals do not call AI. The full panel can optionally enrich suggestions with AI when an `AIConfig` is available.

## Light signals (no AI)

When `seo.lightSignals` is not `false`, the editor runs deterministic checks on the document:

| Signal type           | What it catches |
| --------------------- | ---------------- |
| `missing-h1`          | Content exists but no level-1 heading |
| `weak-title`          | H1 text shorter than 10 or longer than 70 characters |
| `heading-hierarchy`   | A heading skips a level (e.g. H1 → H3) |
| `empty-alt`           | Image nodes without non-empty `alt` |

These are computed in the editor extension from the ProseMirror document only—no network calls.

## Pre-publish panel

When `seo.prePublishPanel` is not `false`, publishing opens a review UI with:

- Aggregated **SEO score** (0–100)
- **Issues** and **suggestions**
- **Readability** metrics (e.g. Flesch-style scoring via local analysis)
- **Keyword** analysis when `targetKeywords` is set
- **SERP preview** (title/description length awareness)

If you pass **AI** config alongside SEO, the analyzer may add optional AI-powered title and meta description suggestions; core scoring and issues remain rule-based.

## `SEOConfig`

```typescript
import type { SEOConfig } from "@writeflow/editor";

const seo: SEOConfig = {
  lightSignals: true, // default-on; set false to disable inline signals
  prePublishPanel: true, // default-on; set false to skip the modal flow
  targetKeywords: ["next.js", "editor"],
  locale: "en-US",
  onAnalysis: (analysis) => {
    console.log("Score:", analysis.score);
  },
};
```

## `SEOAnalysis`

```typescript
interface SEOAnalysis {
  score: number; // 0–100
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
}
```

Use `onPublish` on `<Editor />` to receive the latest `SEOAnalysis` when the user confirms publish from the panel.

## `useSEOAnalysis`

For custom UIs, run analysis against the same Tiptap `Editor` instance. When you also use `useWriteFlowEditor`, pass its `signals` into the fourth argument so the hook matches the built-in editor behavior.

```tsx
import { useWriteFlowEditor, useSEOAnalysis } from "@writeflow/editor";
import type { SEOConfig, AIConfig } from "@writeflow/editor";

const seo: SEOConfig = { targetKeywords: ["documentation"] };
const ai: AIConfig | undefined = undefined; // or pass AIConfig for optional AI title/meta suggestions

const { editor, signals } = useWriteFlowEditor({ seo });

const { analysis, isAnalyzing, score, runAnalysis } = useSEOAnalysis(
  editor,
  seo,
  ai,
  signals,
);

await runAnalysis();
console.log(analysis?.score, analysis?.issues, analysis?.suggestions);
```

- `runAnalysis()` executes `analyzeContent` (readability, headings, keywords, optional AI suggestions).

## Keyboard shortcut

The editor registers **Mod+Shift+P** (⌘⇧P on macOS, Ctrl+Shift+P on Windows/Linux) to open the pre-publish flow when `prePublishPanel` is enabled—same as the “publish” path that runs analysis.

## Notes

- Set `seo.locale` to align analysis copy and numeric formatting with your app locale where applicable.
- Full analysis is heavier than light signals; trigger it at publish or on explicit user action rather than on every keystroke.
