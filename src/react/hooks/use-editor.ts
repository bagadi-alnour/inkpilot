import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { EditorConfig, EditorContent, SEOSignal } from '@writeflow/types';
import { createWriteFlowKit } from '@writeflow/core';
import { AIRewriteExtension } from '@writeflow/core';
import { SEOSignalsExtension } from '@writeflow/core';
import { ImageUploadExtension } from '@writeflow/core';
import { KeyboardShortcutsExtension } from '@writeflow/core';
import { getContent } from '@writeflow/core';
import { debounce } from '@writeflow/utils';

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

export function useWriteFlowEditor(options: UseEditorOptions): UseEditorReturn {
  const [content, setContentState] = useState<EditorContent | null>(null);
  const [signals, setSignals] = useState<SEOSignal[]>([]);
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  const editor = useTiptapEditor({
    extensions: [
      ...createWriteFlowKit({ placeholder: options.placeholder }),
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

  const debouncedOnChange = useCallback(
    debounce((c: EditorContent) => {
      onChangeRef.current?.(c);
    }, 300),
    [],
  );

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
