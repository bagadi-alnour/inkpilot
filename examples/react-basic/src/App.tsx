import { useState } from 'react';
import { Editor } from '@inkpilot/editor';
import type { AIConfig, EditorContent, PublishPayload } from '@inkpilot/editor';
import '@inkpilot/editor/styles.css';
import { locales, translations } from './translations';

// The Vite dev server serves /api/inkpilot (see server/inkpilot-plugin.ts); keys stay on the server.
const AI: AIConfig = { endpoint: '/api/inkpilot', defaultTone: 'formal', defaultIntent: 'clarify' };

export function App() {
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [published, setPublished] = useState<string | null>(null);
  const [locale, setLocale] = useState('en');

  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0];

  const handleChange = (content: EditorContent) => {
    setWordCount(content.wordCount);
    setReadingTime(content.readingTime);
  };

  const handlePublish = ({ content, meta, report }: PublishPayload) => {
    // A real app would save these; the demo logs them.
    console.log('Published', { meta, score: report.score, issues: report.issues.length, html: content.html });
    setPublished(`Published “${meta.title || meta.slug}” · Inkpilot checks ${report.score}/100`);
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

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          background: theme === 'dark' ? '#0f172a' : '#fff',
        }}
      >
        <Editor
          ai={AI}
          theme={{ mode: theme, preset: 'default' }}
          locale={locale}
          i18n={{ locale, translations: translations[locale] }}
          seo={{
            liveSignals: true,
            prePublishPanel: true,
            keywords: ['build time'],
          }}
          onChange={handleChange}
          onPublish={handlePublish}
          placeholder={translations[locale]?.['general.placeholder'] ?? 'Start writing something amazing...'}
          autoFocus
        />
      </div>

      {published && (
        <p role="status" style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
          {published}
        </p>
      )}

      <footer style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Select text to rewrite it with AI, or hover an underlined issue and choose Fix with AI.
        <br />
        Click the score in the toolbar (or press <kbd>Cmd/Ctrl+Alt+P</kbd>) to review and publish.
      </footer>
    </div>
  );
}
