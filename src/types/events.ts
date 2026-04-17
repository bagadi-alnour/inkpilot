import type { EditorContent } from './editor';
import type { SEOSignal, SEOAnalysis } from './seo';
import type { RewriteResult } from './ai';
import type { UploadedFile } from './storage';

export interface EditorEventMap {
  'content:change': EditorContent;
  'content:save': EditorContent;

  'ai:rewrite:start': { original: string; tone: string; intent: string };
  'ai:rewrite:stream': { partial: string };
  'ai:rewrite:complete': RewriteResult;
  'ai:rewrite:cancel': void;
  'ai:rewrite:error': Error;

  'seo:signals:update': SEOSignal[];
  'seo:analysis:start': void;
  'seo:analysis:complete': SEOAnalysis;

  'image:upload:start': { file: File };
  'image:upload:progress': { file: File; progress: number };
  'image:upload:complete': UploadedFile;
  'image:upload:error': { file: File; error: Error };

  'theme:change': { mode: string };

  'editor:focus': void;
  'editor:blur': void;
  'editor:ready': void;
  'editor:destroy': void;
}

export type EditorEventName = keyof EditorEventMap;
export type EditorEventHandler<T extends EditorEventName> = (payload: EditorEventMap[T]) => void;

export interface EditorEvents {
  on<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>): void;
  off<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>): void;
  emit<T extends EditorEventName>(event: T, payload: EditorEventMap[T]): void;
}
