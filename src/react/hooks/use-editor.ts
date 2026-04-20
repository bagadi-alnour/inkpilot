import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { EditorConfig, EditorContent, SEOSignal } from '@inkpilot/types';
import { createInkpilotKit } from '@inkpilot/core';
import { AIRewriteExtension } from '@inkpilot/core';
import { SEOSignalsExtension } from '@inkpilot/core';
import { ImageUploadExtension } from '@inkpilot/core';
import { KeyboardShortcutsExtension } from '@inkpilot/core';
import { getContent } from '@inkpilot/core';
import { debounce } from '@inkpilot/utils';

export interface UseEditorOptions extends EditorConfig {
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onRewrite?: () => void;
  onPublish?: () => void;
}

export interface UseEditorReturn {
  editor: Editor | null;
  content: EditorContent | null;
  signals: SEOSignal[];
  setContent: (html: string) => void;
  isEmpty: boolean;
}

export function useInkpilotEditor(options: UseEditorOptions): UseEditorReturn {
  const [content, setContentState] = useState<EditorContent | null>(null);
  const [signals, setSignals] = useState<SEOSignal[]>([]);
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  const debouncedOnChange = useMemo(
    () =>
      debounce((c: EditorContent) => {
        onChangeRef.current?.(c);
      }, 300),
    [],
  );

  const editor = useTiptapEditor({
    extensions: [
      ...createInkpilotKit({ placeholder: options.placeholder }),
      AIRewriteExtension.configure({ enabled: !!options.ai }),
      SEOSignalsExtension.configure({
        enabled: options.seo?.lightSignals !== false,
        onSignalsUpdate: setSignals,
      }),
      ImageUploadExtension.configure({
        storage: options.storage,
        image: options.image,
      }),
      KeyboardShortcutsExtension.configure({
        onRewrite: options.onRewrite,
        onPublish: options.onPublish,
      }),
    ],
    content: options.content?.html ?? '',
    autofocus: options.autoFocus ? 'end' : false,
    editable: !options.readOnly,
    onUpdate: ({ editor: ed }) => {
      const newContent = getContent(ed);
      setContentState(newContent);
      debouncedOnChange(newContent);
    },
  });

  const setContent = useCallback(
    (html: string) => {
      editor?.commands.setContent(html);
    },
    [editor],
  );

  const isEmpty = !editor || editor.isEmpty;

  useEffect(() => {
    if (editor && !content) {
      setContentState(getContent(editor));
    }
  }, [editor, content]);

  return { editor, content, signals, setContent, isEmpty };
}
