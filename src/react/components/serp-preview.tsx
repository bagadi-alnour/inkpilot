import type { SERPPreviewData } from '@writeflow/types';
import { useTranslation } from '@writeflow/i18n';

interface SERPPreviewProps {
  data: SERPPreviewData;
}

export function SERPPreview({ data }: SERPPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="wf-seo-panel-section">
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{t('seo.serp.title')}</h3>
      <p style={{ fontSize: 12, color: 'var(--wf-color-muted-fg)', marginBottom: 8 }}>
        {t('seo.serp.preview')}
      </p>
      <div className="wf-serp-preview">
        <div className="wf-serp-title">{data.title}</div>
        <div className="wf-serp-url">{data.url}</div>
        <div className="wf-serp-description">{data.description}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--wf-color-muted-fg)' }}>
        Title: {data.titleLength}/60 chars &middot; Description: {data.descriptionLength}/160 chars
      </div>
    </div>
  );
}
