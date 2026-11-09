// Main editor component and hooks
export { Editor } from './react/editor';
export type { EditorProps } from './react/editor';

// Hooks API
export { useInkpilotEditor } from './react/hooks/use-editor';
export { useAIRewrite } from './react/hooks/use-ai-rewrite';
export { useSEOReport } from './react/hooks/use-seo-report';
export { useTheme } from './react/hooks/use-theme';

// All public types
export type {
  EditorConfig,
  EditorContent,
  EditorInstance,
  PublishMeta,
  PublishPayload,
  AIConfig,
  AIBehaviour,
  AIEndpointConfig,
  AITransportConfig,
  AITone,
  AIIntent,
  RewriteResult,
  RewriteOptions,
  SEOConfig,
  SEOIssue,
  SEOIssueCode,
  SEOIssueSeverity,
  SEOFixKind,
  SEOReport,
  SEORuleOptions,
  ThemeConfig,
  ThemeMode,
  ThemeColors,
  ThemePreset,
  I18nConfig,
  TranslationStrings,
  TranslationKey,
  TranslationParams,
  ImageConfig,
  ImageUploader,
  UploadedImage,
} from './types';

// AI transport and wire protocol (pair with `@inkpilot/editor/server`)
export { createFetchTransport } from './ai/transport';
export type { InkpilotTransport, FetchTransportOptions } from './ai/transport';
export type { StreamRequest, StreamEvent, StreamErrorCode, FixableIssueCode } from './protocol';

// Utilities for advanced users
export { presignedUpload, prepareImage } from './image';
export type { PresignedUploadOptions } from './image';
export { analyzeDocument, DEFAULT_RULE_OPTIONS } from './seo/engine';
export { slugify } from './seo/slug';
