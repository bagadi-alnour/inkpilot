// Main editor component and hooks
export { Editor } from './react/editor';
export type { EditorProps } from './react/editor';

// Hooks API
export { useWriteFlowEditor } from './react/hooks/use-editor';
export { useAIRewrite } from './react/hooks/use-ai-rewrite';
export { useSEOAnalysis } from './react/hooks/use-seo-analysis';
export { useStorage } from './react/hooks/use-storage';
export { useTheme } from './react/hooks/use-theme';

// All public types
export type {
  EditorConfig,
  EditorContent,
  EditorInstance,
  AIConfig,
  AIProvider,
  AITone,
  AIIntent,
  RewriteResult,
  RewriteOptions,
  DiffSegment,
  AIProviderAdapter,
  StorageConfig,
  StorageProvider,
  StorageAdapter,
  UploadedFile,
  SEOConfig,
  SEOAnalysis,
  SEOIssue,
  SEOSuggestion,
  SEOSignal,
  SEOSignalType,
  SERPPreviewData,
  ThemeConfig,
  ThemeMode,
  ThemeColors,
  ThemePreset,
  I18nConfig,
  TranslationStrings,
  TranslationKey,
  ImageConfig,
  ImageFormat,
  EditorEventMap,
  EditorEventName,
} from './types';

// Utilities for advanced users
export { createAIProvider } from './ai/provider';
export { createStorageAdapter } from './storage/factory';
export { computeDiff } from './ai/diff';
export { analyzeContent } from './seo/analyzer';
export { generateSERPPreview } from './seo/serp-preview';
