# TypeScript

Everything is typed and exported from the package root. The ones you'll reach for:

| Type | |
|---|---|
| `EditorProps`, `EditorConfig` | `<Editor />` props |
| `EditorContent` | `html`, `markdown`, `json`, `text`, `wordCount`, `readingTime` |
| `PublishPayload`, `PublishMeta` | what `onPublish` receives |
| `AIConfig`, `AIEndpointConfig`, `AITransportConfig` | the `ai` prop |
| `InkpilotTransport`, `StreamRequest`, `StreamEvent` | custom transports |
| `ImageConfig`, `ImageUploader`, `UploadedImage` | the `image` prop |
| `SEOConfig`, `SEORuleOptions` | the `seo` prop |
| `SEOReport`, `SEOIssue`, `SEOIssueCode` | analysis results |
| `TranslationStrings`, `TranslationKey`, `TranslationParams` | i18n |

Server types (`InkpilotHandlerOptions`, `StreamRequest`, ...) come from `@inkpilot/editor/server`.

`SEOIssueCode` is a string union. Translations are typed against it, so `seo.issue.<code>` keys can't go missing:

```ts
const label = (code: SEOIssueCode) => t(`seo.issue.${code}`);
```

`AIConfig` is a union with `never` on the other branch. Passing both `endpoint` and `transport` is a type error.
