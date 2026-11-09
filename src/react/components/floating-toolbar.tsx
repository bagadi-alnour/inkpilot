import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { AITone, AIIntent } from '@inkpilot/types';
import { useTranslation } from '@inkpilot/i18n';
import { resolveTarget } from '../../core/content/proposal';
import { getRewriteSession } from '../../core/extensions/rewrite-session';

interface FloatingToolbarProps {
  editor: Editor | null;
  /** An AI transport is configured. */
  enabled: boolean;
  defaultTone?: AITone;
  defaultIntent?: AIIntent;
}

const TONES: AITone[] = ['formal', 'casual', 'persuasive'];
const INTENTS: AIIntent[] = ['simplify', 'expand', 'clarify'];

/**
 * Bubble menu over a text selection: pick tone and intent, then Rewrite or Rephrase.
 * The proposal itself is shown in the document by the rewrite session, so this menu
 * hides while a session is open.
 */
export function FloatingToolbar({ editor, enabled, defaultTone = 'casual', defaultIntent = 'clarify' }: FloatingToolbarProps) {
  const { t } = useTranslation();
  const [tone, setTone] = useState<AITone>(defaultTone);
  const [intent, setIntent] = useState<AIIntent>(defaultIntent);

  useEffect(() => setTone(defaultTone), [defaultTone]);
  useEffect(() => setIntent(defaultIntent), [defaultIntent]);

  // Unsupported selections (code, images, mixed blocks) are explained instead of rewritten lossily.
  const blockedReason = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed || !enabled) return null;
      const { from, to } = ed.state.selection;
      const target = resolveTarget(ed.state.doc, from, to);
      return target.ok ? null : target.reason;
    },
  });

  if (!editor || !enabled) return null;

  const rewrite = (chosenIntent: AIIntent) => editor.chain().focus().rewriteSelection({ tone, intent: chosenIntent }).run();

  return (
    <BubbleMenu
      editor={editor}
      className="wf-floating-toolbar wf-floating-toolbar-live"
      role="toolbar"
      aria-label="AI writing tools"
      shouldShow={({ editor: ed, state, from, to }) =>
        ed.isEditable && to - from > 1 && !getRewriteSession(state) && state.doc.textBetween(from, to).trim().length > 1
      }
    >
      <select className="wf-live-select" value={tone} onChange={(e) => setTone(e.target.value as AITone)} aria-label={t('ai.tone')}>
        {TONES.map((option) => (
          <option key={option} value={option}>
            {t(`ai.tone.${option}`)}
          </option>
        ))}
      </select>
      <select className="wf-live-select" value={intent} onChange={(e) => setIntent(e.target.value as AIIntent)} aria-label={t('ai.intent')}>
        {INTENTS.map((option) => (
          <option key={option} value={option}>
            {t(`ai.intent.${option}`)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="wf-floating-toolbar-btn"
        disabled={!!blockedReason}
        title={blockedReason ?? undefined}
        onClick={() => rewrite(intent)}
      >
        {t('ai.rewrite')}
      </button>
      {/* Lighter pass: same tone, clarify intent (clearer wording, similar length). */}
      <button
        type="button"
        className="wf-floating-toolbar-btn wf-floating-toolbar-btn-secondary"
        disabled={!!blockedReason}
        title={blockedReason ?? undefined}
        onClick={() => rewrite('clarify')}
      >
        {t('ai.rephrase')}
      </button>
      {blockedReason && <span className="wf-floating-toolbar-note">{blockedReason}</span>}
    </BubbleMenu>
  );
}
