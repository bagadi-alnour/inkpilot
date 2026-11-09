import { useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import type { RewriteOptions } from '@inkpilot/types';
import { getRewriteSession } from '../../core/extensions/rewrite-session';
import type { RewriteStatus } from '../../core/extensions/rewrite-session';
import type { StreamErrorCode } from '../../protocol';

export interface RewriteSessionSnapshot {
  status: RewriteStatus;
  error: { code: StreamErrorCode; message: string } | null;
  from: number;
  to: number;
}

export interface UseAIRewriteReturn {
  /** The open proposal, if any. Its preview and actions render inside the document. */
  session: RewriteSessionSnapshot | null;
  /** Rewrite the current selection. False when nothing rewritable is selected or AI is off. */
  rewrite: (options?: RewriteOptions) => boolean;
  accept: () => boolean;
  reject: () => boolean;
  retry: () => boolean;
}

/**
 * Drive AI rewrites from your own UI. The editor's built-in bubble menu uses the
 * same commands; proposals are previewed in place and committed only on accept.
 */
export function useAIRewrite(editor: Editor | null, defaults: RewriteOptions = {}): UseAIRewriteReturn {
  const session = useEditorState({
    editor,
    selector: ({ editor: ed }): RewriteSessionSnapshot | null => {
      const current = ed ? getRewriteSession(ed.state) : null;
      return current
        ? { status: current.status, error: current.error, from: current.target.from, to: current.target.to }
        : null;
    },
  });

  const { tone: defaultTone = 'casual', intent: defaultIntent = 'clarify', preserveMeaning: defaultPreserve = true } = defaults;
  const rewrite = useCallback(
    (options: RewriteOptions = {}) =>
      !!editor?.chain().focus().rewriteSelection({
        tone: options.tone ?? defaultTone,
        intent: options.intent ?? defaultIntent,
        preserveMeaning: options.preserveMeaning ?? defaultPreserve,
      }).run(),
    [editor, defaultTone, defaultIntent, defaultPreserve],
  );
  const accept = useCallback(() => !!editor?.chain().focus().acceptRewrite().run(), [editor]);
  const reject = useCallback(() => !!editor?.chain().focus().rejectRewrite().run(), [editor]);
  const retry = useCallback(() => !!editor?.chain().focus().retryRewrite().run(), [editor]);

  return { session: session ?? null, rewrite, accept, reject, retry };
}
