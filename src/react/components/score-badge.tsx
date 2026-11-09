import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useTranslation } from '@inkpilot/i18n';
import { getSEOReport } from '../../core/extensions/seo-report';

interface ScoreBadgeProps {
  editor: Editor | null;
  /** Makes the badge a button, e.g. to open the publish panel. */
  onClick?: () => void;
}

/** Toolbar ring showing the live Inkpilot checks score (design option A). */
export function ScoreBadge({ editor, onClick }: ScoreBadgeProps) {
  const { t } = useTranslation();
  const score = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed ? getSEOReport(ed.state).score : null),
  });
  if (score === null) return null;

  const label = t('seo.score.label', { score });
  const ring = <span className="ip-score-ring" style={{ ['--ip-score' as string]: score }} aria-hidden />;
  return onClick ? (
    <button type="button" className="ip-score" aria-label={label} title={label} onClick={onClick}>
      {ring}
      {score}
    </button>
  ) : (
    <span className="ip-score" role="status" aria-label={label} title={label}>
      {ring}
      {score}
    </span>
  );
}
