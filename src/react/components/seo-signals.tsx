import type { SEOSignal } from '@inkpilot/types';
import { useTranslation } from '@inkpilot/i18n';

interface SEOSignalIndicatorsProps {
  signals: SEOSignal[];
}

export function SEOSignalIndicators({ signals }: SEOSignalIndicatorsProps) {
  const { t } = useTranslation();

  if (signals.length === 0) return null;

  const missingH1 = signals.find((s) => s.type === 'missing-h1');

  if (!missingH1) return null;

  return (
    <div
      className="wf-seo-signal-banner"
      role="status"
      aria-live="polite"
      style={{
        padding: '6px 16px',
        fontSize: 13,
        color: 'var(--wf-color-warning, #d97706)',
        background: 'color-mix(in srgb, var(--wf-color-warning, #d97706) 8%, transparent)',
        borderBottom: '1px solid var(--wf-color-border, #e2e8f0)',
      }}
    >
      ⚠ {t('seo.missingH1')}
    </div>
  );
}
