import type { SEOAnalysis, SERPPreviewData } from '@writeflow/types';
import { useTranslation } from '@writeflow/i18n';
import { SERPPreview } from './serp-preview';

interface SEOPanelProps {
  analysis: SEOAnalysis;
  serpPreview?: SERPPreviewData;
  isAnalyzing: boolean;
  onClose: () => void;
  onPublish: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'wf-seo-score-good' : score >= 40 ? 'wf-seo-score-ok' : 'wf-seo-score-poor';
  return <div className={`wf-seo-score ${cls}`}>{score}</div>;
}

function IssueIcon({ type }: { type: 'error' | 'warning' | 'info' }) {
  const colors = { error: 'var(--wf-color-error)', warning: 'var(--wf-color-warning)', info: 'var(--wf-color-muted-fg)' };
  const icons = { error: '✕', warning: '⚠', info: 'ℹ' };
  return <span style={{ color: colors[type], fontWeight: 600 }}>{icons[type]}</span>;
}

export function SEOPanel({ analysis, serpPreview, isAnalyzing, onClose, onPublish }: SEOPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="wf-seo-panel" role="complementary" aria-label={t('seo.panel.title')}>
      <div className="wf-seo-panel-header">
        <span className="wf-seo-panel-title">{t('seo.panel.title')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreBadge score={analysis.score} />
          <button
            type="button"
            className="wf-toolbar-btn"
            onClick={onClose}
            aria-label={t('seo.panel.close')}
          >
            ✕
          </button>
        </div>
      </div>

      {analysis.issues.length > 0 && (
        <div className="wf-seo-panel-section">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {t('seo.panel.issues')} ({analysis.issues.length})
          </h3>
          {analysis.issues.map((issue, i) => (
            <div key={i} className="wf-seo-issue">
              <IssueIcon type={issue.type} />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div className="wf-seo-panel-section">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {t('seo.panel.suggestions')}
          </h3>
          {analysis.suggestions.map((suggestion, i) => (
            <div key={i} className="wf-seo-suggestion">
              <span>{suggestion.message}</span>
              {suggestion.apply && (
                <button
                  type="button"
                  className="wf-ai-panel-btn wf-ai-panel-btn-accept"
                  style={{ padding: '2px 12px', fontSize: 12 }}
                  onClick={suggestion.apply}
                >
                  {t('seo.panel.apply')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {serpPreview && <SERPPreview data={serpPreview} />}

      <div className="wf-seo-panel-section" style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="wf-ai-panel-btn wf-ai-panel-btn-accept"
          onClick={onPublish}
          style={{ flex: 1 }}
        >
          {analysis.issues.filter((i) => i.type === 'error').length > 0
            ? t('seo.panel.publishAnyway')
            : t('seo.panel.publish')}
        </button>
      </div>

      {isAnalyzing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="wf-spinner" />
        </div>
      )}
    </div>
  );
}
