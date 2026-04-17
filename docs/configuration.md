# Configuration

## EditorConfig

The `<Editor>` component accepts all config as props:

```typescript
interface EditorConfig {
  ai?: AIConfig;
  storage?: StorageConfig;
  theme?: ThemeConfig;
  seo?: SEOConfig;
  image?: ImageConfig;
  i18n?: I18nConfig;
  locale?: string;
  content?: Partial<EditorContent>;
  onChange?: (content: EditorContent) => void;
  onPublish?: (content: EditorContent, analysis: SEOAnalysis) => void;
}
```

## AIConfig

```typescript
interface AIConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;          // default: "gpt-4o-mini" (OpenAI) or "claude-sonnet-4-20250514" (Anthropic)
  baseURL?: string;        // custom API endpoint
  defaultTone?: "formal" | "casual" | "persuasive";
  defaultIntent?: "simplify" | "expand" | "clarify";
  preserveMeaning?: boolean;
  onRewrite?: (result: RewriteResult) => void;
}
```

## StorageConfig

```typescript
interface StorageConfig {
  provider: "s3" | "gcs" | "azure";
  bucket: string;
  region?: string;
  endpoint?: string;
  basePath?: string;
  presignedUrlEndpoint?: string;  // recommended for client-side
  accessKeyId?: string;           // server-side only
  secretAccessKey?: string;       // server-side only
  onUpload?: (file: UploadedFile) => void;
}
```

## ThemeConfig

```typescript
interface ThemeConfig {
  mode?: "light" | "dark" | "auto";   // default: "auto"
  preset?: "default" | "minimal" | "editorial";
  colors?: Partial<ThemeColors>;       // override individual colors
}
```

## SEOConfig

```typescript
interface SEOConfig {
  lightSignals?: boolean;       // default: true
  prePublishPanel?: boolean;    // default: true
  targetKeywords?: string[];    // keywords to track
  locale?: string;
  onAnalysis?: (analysis: SEOAnalysis) => void;
}
```

## Editor Props

Additional props beyond EditorConfig:

```typescript
interface EditorProps extends EditorConfig {
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}
```
