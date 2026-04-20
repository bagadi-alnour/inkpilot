import { useState, useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import type { AIConfig, AITone, AIIntent, RewriteResult, DiffSegment } from '@inkpilot/types';
import { createAIProvider } from '@inkpilot/ai';
import { createRewriteSession, executeRewrite } from '@inkpilot/ai';
import type { RewriteSession } from '@inkpilot/ai';

export interface UseAIRewriteReturn {
  rewrite: (options?: { tone?: AITone; intent?: AIIntent; preserveMeaning?: boolean }) => void;
  liveRewrite: (tone: AITone, intent: AIIntent) => void;
  revert: () => void;
  isRewriting: boolean;
  isLive: boolean;
  result: RewriteResult | null;
  diff: DiffSegment[];
  streamedText: string;
  accept: () => void;
  reject: () => void;
  abort: () => void;
}

interface LiveState {
  originalText: string;
  from: number;
  to: number;
  lastAppliedLength: number;
}

export function useAIRewrite(
  editor: Editor | null,
  config?: AIConfig,
): UseAIRewriteReturn {
  const [isRewriting, setIsRewriting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [diff, setDiff] = useState<DiffSegment[]>([]);
  const [streamedText, setStreamedText] = useState('');
  const sessionRef = useRef<RewriteSession | null>(null);
  const liveRef = useRef<LiveState | null>(null);

  useEffect(() => {
    return () => {
      sessionRef.current?.controller.abort();
    };
  }, []);

  const restoreOriginal = useCallback(() => {
    if (!editor || !liveRef.current) return;
    const { originalText, from } = liveRef.current;
    const currentTo = from + liveRef.current.lastAppliedLength;
    editor.chain().focus()
      .deleteRange({ from, to: currentTo })
      .insertContentAt(from, originalText)
      .run();
    liveRef.current.lastAppliedLength = originalText.length;
  }, [editor]);

  const liveRewrite = useCallback(
    (tone: AITone, intent: AIIntent) => {
      if (!editor || !config) return;

      if (sessionRef.current) {
        sessionRef.current.controller.abort();
      }

      if (!liveRef.current) {
        const { from, to } = editor.state.selection;
        if (from === to) return;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (!selectedText.trim()) return;
        liveRef.current = { originalText: selectedText, from, to, lastAppliedLength: selectedText.length };
      } else {
        restoreOriginal();
      }

      const live = liveRef.current;
      const provider = createAIProvider(config);
      const session = createRewriteSession(
        editor,
        {
          tone,
          intent,
          preserveMeaning: config.preserveMeaning ?? true,
          onStream(accumulated, diffSegments) {
            setStreamedText(accumulated);
            setDiff(diffSegments);
            if (!editor || !live) return;
            const currentTo = live.from + live.lastAppliedLength;
            editor.chain()
              .deleteRange({ from: live.from, to: currentTo })
              .insertContentAt(live.from, accumulated)
              .run();
            live.lastAppliedLength = accumulated.length;
          },
          onComplete(r) {
            setResult(r);
            setIsRewriting(false);
          },
          onError(error) {
            console.error('Rewrite failed:', error);
            sessionRef.current = null;
            setIsRewriting(false);
            setIsLive(false);
            restoreOriginal();
            liveRef.current = null;
            setResult(null);
            setDiff([]);
            setStreamedText('');
          },
        },
        config,
      );

      if (!session) return;

      sessionRef.current = session;
      setIsRewriting(true);
      setIsLive(true);
      setResult(null);
      setDiff([]);
      setStreamedText('');

      void executeRewrite(editor, provider, session);
    },
    [editor, config, restoreOriginal],
  );

  const revert = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.controller.abort();
    }
    restoreOriginal();
    liveRef.current = null;
    sessionRef.current = null;
    setIsRewriting(false);
    setIsLive(false);
    setResult(null);
    setDiff([]);
    setStreamedText('');
  }, [restoreOriginal]);

  const rewrite = useCallback(
    (options?: { tone?: AITone; intent?: AIIntent; preserveMeaning?: boolean }) => {
      if (!editor || !config) return;

      const provider = createAIProvider(config);
      const session = createRewriteSession(
        editor,
        {
          tone: options?.tone,
          intent: options?.intent,
          preserveMeaning: options?.preserveMeaning,
          onStream(accumulated, diffSegments) {
            setStreamedText(accumulated);
            setDiff(diffSegments);
          },
          onComplete(r) {
            setResult(r);
            setIsRewriting(false);
          },
          onError(error) {
            console.error('Rewrite failed:', error);
            sessionRef.current = null;
            setIsRewriting(false);
            setResult(null);
            setDiff([]);
            setStreamedText('');
          },
        },
        config,
      );

      if (!session) return;

      sessionRef.current = session;
      setIsRewriting(true);
      setIsLive(false);
      setResult(null);
      setDiff([]);
      setStreamedText('');

      void executeRewrite(editor, provider, session);
    },
    [editor, config],
  );

  const accept = useCallback(() => {
    if (!editor || !sessionRef.current || !result) return;

    const acceptedResult = { ...result, accepted: true };

    if (isLive) {
      liveRef.current = null;
      sessionRef.current = null;
      config?.onRewrite?.(acceptedResult);
      setIsRewriting(false);
      setIsLive(false);
      setResult(null);
      setDiff([]);
      setStreamedText('');
      return;
    }

    const { from, to } = sessionRef.current;
    editor.chain().focus()
      .deleteRange({ from, to })
      .insertContentAt(from, result.rewritten)
      .run();

    config?.onRewrite?.(acceptedResult);
    sessionRef.current = null;
    setIsRewriting(false);
    setResult(null);
    setDiff([]);
    setStreamedText('');
  }, [config, editor, result, isLive]);

  const reject = useCallback(() => {
    if (result) {
      config?.onRewrite?.({ ...result, accepted: false });
    }
    if (isLive) {
      revert();
      return;
    }
    sessionRef.current?.controller.abort();
    sessionRef.current = null;
    liveRef.current = null;
    setIsRewriting(false);
    setIsLive(false);
    setResult(null);
    setDiff([]);
    setStreamedText('');
  }, [config, isLive, result, revert]);

  const abort = useCallback(() => {
    sessionRef.current?.controller.abort();
    setIsRewriting(false);
  }, []);

  return { rewrite, liveRewrite, revert, isRewriting, isLive, result, diff, streamedText, accept, reject, abort };
}
