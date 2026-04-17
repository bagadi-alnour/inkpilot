import { useEffect } from 'react';
import type { DiffSegment, RewriteResult } from '@writeflow/types';
import { useTranslation } from '@writeflow/i18n';
import { DiffView } from './diff-view';

interface AIRewritePanelProps {
  isRewriting: boolean;
  diff: DiffSegment[];
  result: RewriteResult | null;
  onAccept: () => void;
  onReject: () => void;
}

export function AIRewritePanel({
  isRewriting,
  diff,
  result,
  onAccept,
  onReject,
}: AIRewritePanelProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onAccept();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    };

    if (isRewriting || result) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isRewriting, result, onAccept, onReject]);

  if (!isRewriting && !result) return null;
  if (diff.length === 0 && isRewriting) {
    return (
      <div className="wf-ai-panel">
        <div className="wf-ai-panel-content" style={{ textAlign: 'center' }}>
          <span className="wf-spinner" /> {t('ai.rewriting')}
        </div>
      </div>
    );
  }

  return (
    <div className="wf-ai-panel" role="region" aria-label="AI rewrite preview">
      <DiffView segments={diff} />
      <div className="wf-ai-panel-actions">
        <button
          type="button"
          className="wf-ai-panel-btn wf-ai-panel-btn-accept"
          onClick={onAccept}
          disabled={isRewriting}
          aria-keyshortcuts="Enter"
        >
          {t('ai.accept')} <kbd>↵</kbd>
        </button>
        <button
          type="button"
          className="wf-ai-panel-btn wf-ai-panel-btn-reject"
          onClick={onReject}
          aria-keyshortcuts="Escape"
        >
          {t('ai.reject')} <kbd>Esc</kbd>
        </button>
        {isRewriting && <span className="wf-spinner" />}
      </div>
    </div>
  );
}
