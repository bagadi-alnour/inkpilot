# Hooks API

For developers who need granular control beyond the `<Editor>` component.

## useWriteFlowEditor

```typescript
import { useWriteFlowEditor } from "@writeflow/editor";

function CustomEditor() {
  const { editor, content, signals, setContent, isEmpty } = useWriteFlowEditor({
    ai: { provider: "openai", apiKey: "..." },
    theme: { mode: "dark" },
    placeholder: "Start writing...",
  });

  return <EditorContent editor={editor} />;
}
```

## useAIRewrite

```typescript
import { useAIRewrite } from "@writeflow/editor";

const { rewrite, isRewriting, result, diff, accept, reject, abort } = useAIRewrite(editor, {
  provider: "openai",
  apiKey: "...",
});

// Trigger rewrite with custom options
rewrite({ tone: "formal", intent: "simplify" });

// Accept or reject the result
accept(); // applies rewritten text
reject(); // restores original
```

## useSEOAnalysis

```typescript
import { useSEOAnalysis } from "@writeflow/editor";

const { signals, analysis, isAnalyzing, score, runAnalysis } = useSEOAnalysis(
  editor,
  { lightSignals: true, targetKeywords: ["react", "editor"] },
  aiConfig
);

// Manually trigger full analysis
await runAnalysis();
console.log(analysis?.score, analysis?.issues);
```

## useStorage

```typescript
import { useStorage } from "@writeflow/editor";

const { upload, isUploading, progress, lastUpload, error } = useStorage({
  provider: "s3",
  bucket: "my-uploads",
  presignedUrlEndpoint: "/api/upload",
});

const result = await upload(file);
```

## useTheme

```typescript
import { useTheme } from "@writeflow/editor";

const { theme, mode, setMode, applyPreset } = useTheme(
  { mode: "auto" },
  containerRef
);

setMode("dark");
applyPreset("editorial");
```
