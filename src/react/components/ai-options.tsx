import type { AITone, AIIntent } from '@writeflow/types';
import { useTranslation } from '@writeflow/i18n';

interface AIOptionsProps {
  tone: AITone;
  intent: AIIntent;
  preserveMeaning: boolean;
  onToneChange: (tone: AITone) => void;
  onIntentChange: (intent: AIIntent) => void;
  onPreserveMeaningChange: (preserve: boolean) => void;
}

const TONES: AITone[] = ['formal', 'casual', 'persuasive'];
const INTENTS: AIIntent[] = ['simplify', 'expand', 'clarify'];

export function AIOptions({
  tone,
  intent,
  preserveMeaning,
  onToneChange,
  onIntentChange,
  onPreserveMeaningChange,
}: AIOptionsProps) {
  const { t } = useTranslation();

  return (
    <div className="wf-ai-options" role="menu" aria-label={t('ai.options')}>
      <div className="wf-ai-options-group">
        <div className="wf-ai-options-label">{t('ai.tone')}</div>
        {TONES.map((toneOption) => (
          <button
            key={toneOption}
            type="button"
            className={`wf-ai-options-item${tone === toneOption ? ' is-selected' : ''}`}
            onClick={() => onToneChange(toneOption)}
            role="menuitemradio"
            aria-checked={tone === toneOption}
          >
            {t(`ai.tone.${toneOption}` as const)}
          </button>
        ))}
      </div>

      <div className="wf-ai-options-group">
        <div className="wf-ai-options-label">{t('ai.intent')}</div>
        {INTENTS.map((intentOption) => (
          <button
            key={intentOption}
            type="button"
            className={`wf-ai-options-item${intent === intentOption ? ' is-selected' : ''}`}
            onClick={() => onIntentChange(intentOption)}
            role="menuitemradio"
            aria-checked={intent === intentOption}
          >
            {t(`ai.intent.${intentOption}` as const)}
          </button>
        ))}
      </div>

      <div className="wf-ai-options-group">
        <label className="wf-ai-options-item" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preserveMeaning}
            onChange={(e) => onPreserveMeaningChange(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          {t('ai.preserveMeaning')}
        </label>
      </div>
    </div>
  );
}
