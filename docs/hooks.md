# Hooks

For building your own UI around the editor. Inside `<Editor />` you rarely need them.

## `useInkpilotEditor(options)`

Creates the editor with Inkpilot's extensions. It takes the same options as `<Editor />` plus `transport`. It returns `{ editor, content, setContent, isEmpty }`. Render the editor with Tiptap's `<EditorContent editor={editor} />`.

## `useAIRewrite(editor, defaults?)`

```ts
const { session, rewrite, accept, reject, retry } = useAIRewrite(editor, { tone: 'formal' });

rewrite({ intent: 'simplify' });   // rewrite the current selection
session?.status;                   // 'streaming' | 'ready' | 'error'
session?.error?.message;
```

The proposal preview and its Accept / Reject bar render inside the document, so these hooks are for extra controls such as a toolbar button.

## `useSEOReport(editor)`

The live report (`{ issues, score }`). It updates shortly after typing stops.

```tsx
const report = useSEOReport(editor);
return <span>{report.score} · {report.issues.length} to review</span>;
```

## `useTheme(config, containerRef)`

Resolves `mode: 'auto'` and the preset into CSS variables on the container. `<Editor />` uses it internally.

## Commands

The extensions add Tiptap commands you can call from anywhere. With `<Editor />`, get the editor from `onReady={(editor) => ...}`.

| Command | |
|---|---|
| `rewriteSelection({ tone, intent, preserveMeaning? })` | rewrite the selection |
| `startRewrite({ from, to, source })` | rewrite a range |
| `acceptRewrite()`, `rejectRewrite()`, `retryRewrite()` | act on the open proposal |
| `fixIssue(id)`, `ignoreIssue(id)`, `refreshReport()` | SEO issues |
| `insertImageFiles(files, pos?)` | insert and upload images |
| `suggestAltText(pos)` | AI alt text for the image at `pos` |
| `cancelUploads()` | stop uploads in flight and remove those images |
| `requestPublish()` | open the publish panel, or call `onPublish` when the panel is off |
