import { useState, useMemo } from 'react';
import { Editor } from '@inkpilot/editor';
import type { EditorContent, SEOAnalysis, AIConfig, AIProvider } from '@inkpilot/editor';
import '@inkpilot/editor/styles.css';
import { locales, translations } from './translations';
import { resolveAIFromEnv } from './aiEnv';

const envAI = resolveAIFromEnv();
const envProvider = envAI.provider ?? 'openai';
const envKey = envAI.apiKey;

export function App() {
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [provider, setProvider] = useState<AIProvider>(envProvider);
  const [apiKey, setApiKey] = useState(envKey ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!envAI.hasAnyKey);
  const [locale, setLocale] = useState('en');

  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0];

  const aiConfig: AIConfig | undefined = useMemo(() => {
    if (!apiKey.trim()) return undefined;
    return {
      provider,
      apiKey: apiKey.trim(),
      defaultTone: 'formal' as const,
      defaultIntent: 'clarify' as const,
      preserveMeaning: true,
    };
  }, [provider, apiKey]);

  const handleChange = (content: EditorContent) => {
    setWordCount(content.wordCount);
    setReadingTime(content.readingTime);
  };

  const handlePublish = (content: EditorContent, analysis: SEOAnalysis) => {
    console.log('Published!', { content, analysis });
    alert(`Published! SEO Score: ${analysis.score}/100\nWord count: ${content.wordCount}`);
  };

  return (
    <div
      style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}
      dir={currentLocale.dir}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Inkpilot Demo</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            AI-powered editor infrastructure
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {wordCount} words &middot; {readingTime} min read
          </span>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 13,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              padding: '6px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              background: '#fff',
            }}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
          <input
            type="password"
            placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              flex: 1,
              minWidth: 240,
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
            }}
          />
          <span style={{ fontSize: 12, color: aiConfig ? '#16a34a' : '#94a3b8' }}>
            {aiConfig ? 'AI enabled' : 'Enter key to enable AI'}
          </span>
        </div>
      )}

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          background: theme === 'dark' ? '#0f172a' : '#fff',
        }}
      >
        <Editor
          ai={aiConfig}
          theme={{ mode: theme, preset: 'default' }}
          locale={locale}
          i18n={{ locale, translations: translations[locale] }}
          seo={{
            lightSignals: true,
            prePublishPanel: true,
            targetKeywords: ['inkpilot', 'editor'],
          }}
          onChange={handleChange}
          onPublish={handlePublish}
          placeholder={translations[locale]?.['general.placeholder'] ?? 'Start writing something amazing...'}
          autoFocus
        />
      </div>

      <footer style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Select text to see AI tone/intent dropdowns &mdash; text changes live as you switch.
        <br />
        Click the camera icon in the toolbar to insert images.
        <br />
        Press <kbd>Cmd+Shift+P</kbd> to trigger the pre-publish SEO panel.
      </footer>
    </div>
  );
}
