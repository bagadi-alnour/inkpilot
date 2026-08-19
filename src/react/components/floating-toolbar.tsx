import { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import type { AITone, AIIntent } from '@inkpilot/types';
import { useTranslation } from '@inkpilot/i18n';

interface FloatingToolbarProps {
  editor: Editor | null;
  hasAI: boolean;
  onLiveRewrite: (tone: AITone, intent: AIIntent) => void;
  onRevert: () => void;
  isRewriting: boolean;
  isLive: boolean;
  defaultTone?: AITone;
  defaultIntent?: AIIntent;
}

const TONES: AITone[] = ['formal', 'casual', 'persuasive'];
const INTENTS: AIIntent[] = ['simplify', 'expand', 'clarify'];

export function FloatingToolbar({
  editor,
  hasAI,
  onLiveRewrite,
  onRevert,
  isRewriting,
  isLive,
  defaultTone = 'casual',
  defaultIntent = 'clarify',
}: FloatingToolbarProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tone, setTone] = useState<AITone>(defaultTone);
  const [intent, setIntent] = useState<AIIntent>(defaultIntent);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTone(defaultTone);
  }, [defaultTone]);

  useEffect(() => {
    setIntent(defaultIntent);
  }, [defaultIntent]);

  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      if (!isLive) setVisible(false);
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to);
    if (selectedText.trim().length < 2) {
      if (!isLive) setVisible(false);
      return;
    }

    const coords = editor.view.coordsAtPos(from);
    const editorRect = editor.view.dom.getBoundingClientRect();

    setPosition({
      top: coords.top - editorRect.top - 52,
      left: coords.left - editorRect.left,
    });
    setVisible(true);
  }, [editor, isLive]);

  useEffect(() => {
    if (!editor || !hasAI) return;

    const handleSelectionUpdate = () => {
      if (isLive) return;
      clearTimeout(timerRef.current);
      setVisible(false);
      timerRef.current = setTimeout(updatePosition, 300);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      clearTimeout(timerRef.current);
    };
  }, [editor, hasAI, updatePosition, isLive]);

  useEffect(() => {
    if (!visible || isLive) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, isLive]);

  const handleToneChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTone(e.target.value as AITone);
  }, []);

  const handleIntentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setIntent(e.target.value as AIIntent);
  }, []);

  const handleRewrite = useCallback(() => {
    onLiveRewrite(tone, intent);
  }, [tone, intent, onLiveRewrite]);

  /** Lighter rewrite: same tone, clarify intent (clearer wording, similar length). */
  const handleRephrase = useCallback(() => {
    onLiveRewrite(tone, 'clarify');
  }, [tone, onLiveRewrite]);

  const handleRevert = useCallback(() => {
    onRevert();
    setVisible(false);
  }, [onRevert]);

  if (!visible || !hasAI) return null;

  return (
    <div
      ref={ref}
      className="wf-floating-toolbar wf-floating-toolbar-live"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="AI writing tools"
    >
      {isRewriting && <span className="wf-spinner" aria-hidden />}

      <select
        className="wf-live-select"
        value={tone}
        onChange={handleToneChange}
        disabled={isRewriting}
        aria-label={t('ai.tone')}
      >
        {TONES.map((toneOpt) => (
          <option key={toneOpt} value={toneOpt}>
            {t(`ai.tone.${toneOpt}` as const)}
          </option>
        ))}
      </select>

      <select
        className="wf-live-select"
        value={intent}
        onChange={handleIntentChange}
        disabled={isRewriting}
        aria-label={t('ai.intent')}
      >
        {INTENTS.map((intentOpt) => (
          <option key={intentOpt} value={intentOpt}>
            {t(`ai.intent.${intentOpt}` as const)}
          </option>
        ))}
      </select>

      {!isLive && (
        <>
          <button
            type="button"
            className="wf-floating-toolbar-btn"
            onClick={handleRewrite}
            disabled={isRewriting}
          >
            {t('ai.rewrite')}
          </button>
          <button
            type="button"
            className="wf-floating-toolbar-btn wf-floating-toolbar-btn-secondary"
            onClick={handleRephrase}
            disabled={isRewriting}
          >
            {t('ai.rephrase')}
          </button>
        </>
      )}

      {isLive && (
        <button
          type="button"
          className="wf-live-revert-btn"
          onClick={handleRevert}
          title="Revert to original"
        >
          ↩ {t('ai.reject')}
        </button>
      )}
    </div>
  );
}
