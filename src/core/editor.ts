import { Editor } from '@tiptap/core';
import type { EditorConfig } from '@inkpilot/types';
import { createInkpilotKit } from './extensions/inkpilot-kit';
import { AIRewriteExtension } from './extensions/ai-rewrite';
import { SEOSignalsExtension } from './extensions/seo-signals';
import { ImageUploadExtension } from './extensions/image-upload';
import { KeyboardShortcutsExtension } from './extensions/keyboard-shortcuts';

export interface CreateEditorOptions extends EditorConfig {
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onRewrite?: () => void;
  onPublish?: () => void;
  onSignalsUpdate?: (signals: import('@inkpilot/types').SEOSignal[]) => void;
}

export function createEditor(options: CreateEditorOptions): Editor {
  const {
    ai,
    storage,
    seo,
    image,
    content,
    placeholder,
    autoFocus,
    readOnly,
    onRewrite,
    onPublish,
    onSignalsUpdate,
  } = options;

  return new Editor({
    extensions: [
      ...createInkpilotKit({ placeholder }),
      AIRewriteExtension.configure({
        enabled: !!ai,
      }),
      SEOSignalsExtension.configure({
        enabled: seo?.lightSignals !== false,
        onSignalsUpdate,
      }),
      ImageUploadExtension.configure({
        storage,
        image,
      }),
      KeyboardShortcutsExtension.configure({
        onRewrite,
        onPublish,
      }),
    ],
    content: content?.html ?? '',
    autofocus: autoFocus ? 'end' : false,
    editable: !readOnly,
  });
}
