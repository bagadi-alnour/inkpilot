import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { EditorConfig, EditorContent } from '@inkpilot/types';
import { createInkpilotKit } from '@inkpilot/core';
import { ImageUploadExtension } from '@inkpilot/core';
import { KeyboardShortcutsExtension } from '@inkpilot/core';
import { RewriteSessionExtension } from '../../core/extensions/rewrite-session';
import type { RewriteLabel } from '../../core/extensions/rewrite-session';
import { SEOReportExtension } from '../../core/extensions/seo-report';
import { analyzeContextFrom } from '../seo-context';
import type { ArticleMeta } from '../../seo/engine';
import type { InkpilotTransport } from '../../ai/transport';
import { getContent } from '@inkpilot/core';
import { debounce } from '@inkpilot/utils';

export interface UseEditorOptions extends EditorConfig {
  /** Search metadata the SEO engine should check (from the publish panel). */
  meta?: ArticleMeta;
  /** AI transport for fixes and rewrites; read on use, so it may change between renders. */
  transport?: InkpilotTransport;
  /** Labels for the in-document rewrite bar. */
  rewriteLabel?: (key: RewriteLabel) => string;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  /** Keyboard shortcut handlers; read on use. */
  onRewrite?: () => void;
  onPublish?: () => void;
}

export interface UseEditorReturn {
  editor: Editor | null;
  content: EditorContent | null;
  setContent: (html: string) => void;
  isEmpty: boolean;
}

export function useInkpilotEditor(options: UseEditorOptions): UseEditorReturn {
  const [content, setContentState] = useState<EditorContent | null>(null);
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  // Extensions are created once; they read the latest props through this ref.
  const latest = useRef(options);
  latest.current = options;
  const analyzeContext = () => analyzeContextFrom(latest.current);

  const debouncedOnChange = useMemo(
    () =>
      debounce((c: EditorContent) => {
        onChangeRef.current?.(c);
      }, 300),
    [],
  );

  const editor = useTiptapEditor({
    immediatelyRender: false,
    extensions: [
      ...createInkpilotKit({ placeholder: options.placeholder, codeBlock: options.codeBlock }),
      RewriteSessionExtension.configure({
        getTransport: () => latest.current.transport,
        getContext: () => {
          const { locale, keywords } = analyzeContext();
          return { locale, seo: { keywords } };
        },
        label: (key) => latest.current.rewriteLabel?.(key) ?? key,
        onSettle: (result) => latest.current.ai?.onRewrite?.(result),
      }),
      SEOReportExtension.configure({
        enabled: options.seo?.liveSignals !== false,
        getContext: analyzeContext,
      }),
      ImageUploadExtension.configure({
        getConfig: () => latest.current.image,
        getTransport: () => latest.current.transport,
        getLocale: () => analyzeContext().locale,
      }),
      KeyboardShortcutsExtension.configure({
        onRewrite: () => latest.current.onRewrite?.(),
        onPublish: () => latest.current.onPublish?.(),
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

  return { editor, content, setContent, isEmpty };
}
