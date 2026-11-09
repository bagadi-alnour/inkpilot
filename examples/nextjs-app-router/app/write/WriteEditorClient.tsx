'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Editor, presignedUpload } from '@inkpilot/editor';
import type {
  AIConfig,
  EditorContent,
  PublishPayload,
  ThemePreset,
} from '@inkpilot/editor';
import { locales, translations } from '@/lib/translations';

const PRESETS: { value: ThemePreset; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'editorial', label: 'Editorial' },
];

type WriteEditorClientProps = {
  /** Which model /api/inkpilot uses, for display. */
  modelLabel: string;
};

export default function WriteEditorClient({ modelLabel }: WriteEditorClientProps) {
  const [wordCount, setWordCount] = useState(0);
  const [published, setPublished] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [preset, setPreset] = useState<ThemePreset>('default');
  const [locale, setLocale] = useState('en');

  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0];

  // Every AI request goes through /api/inkpilot (createInkpilotHandler); keys stay on the server.
  const aiConfig: AIConfig = useMemo(() => ({ endpoint: '/api/inkpilot' }), []);

  const handleChange = (content: EditorContent) => {
    setWordCount(content.wordCount);
    setReadingTime(content.readingTime);
  };

  const handlePublish = ({ content, meta, report }: PublishPayload) => {
    // A real app would save these; the demo logs them.
    console.log('Published', { meta, score: report.score, issues: report.issues.length, html: content.html });
    setPublished(`Published “${meta.title || meta.slug}” · Inkpilot checks ${report.score}/100`);
  };

  const border = theme === 'dark' ? '#334155' : '#e2e8f0';
  const subtle = theme === 'dark' ? '#94a3b8' : '#64748b';
  const pageBg = theme === 'dark' ? '#020617' : '#f8fafc';
  const panelBg = theme === 'dark' ? '#1e293b' : '#f8fafc';
  const inputBg = theme === 'dark' ? '#0f172a' : '#fff';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, background: pageBg, minHeight: '100vh' }} dir={currentLocale.dir}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${border}`,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
            Inkpilot Demo
          </h1>
          <p style={{ fontSize: 14, color: subtle, marginTop: 4 }}>
            <Link href="/" style={{ color: '#0f172a' }}>
              ← Home
            </Link>
            {' · '}
            App Router
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: subtle }}>
            {wordCount} words · {readingTime} min read
          </span>

          <label style={{ fontSize: 13, color: subtle, display: 'flex', alignItems: 'center', gap: 6 }}>
            Theme
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as ThemePreset)}
              style={{
                padding: '6px 10px',
                border: `1px solid ${border}`,
                borderRadius: 6,
                fontSize: 13,
                background: inputBg,
                color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              padding: '6px 10px',
              border: `1px solid ${border}`,
              borderRadius: 6,
              fontSize: 13,
              background: inputBg,
              color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
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
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              padding: '6px 14px',
              border: `1px solid ${border}`,
              borderRadius: 6,
              background: 'transparent',
              color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </header>

      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: panelBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
          AI runs on the Next.js server through <code>/api/inkpilot</code> using {modelLabel}.
        </span>
      </div>

      <div
        style={{
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: theme === 'dark' ? '#0f172a' : '#fff',
        }}
      >
        <Editor
          ai={aiConfig}
          theme={{ mode: theme, preset }}
          locale={locale}
          i18n={{ locale, translations: translations[locale] }}
          seo={{
            liveSignals: true,
            prePublishPanel: true,
            keywords: ['build time'],
          }}
          image={{
            upload: presignedUpload('/api/upload'),
            onUploadError: (error) => console.warn('Image upload failed:', error.message),
          }}
          onChange={handleChange}
          onPublish={handlePublish}
          placeholder={
            translations[locale]?.['general.placeholder'] ?? 'Start writing something amazing...'
          }
          autoFocus
        />
      </div>

      {published && (
        <p role="status" style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
          {published}
        </p>
      )}

      <footer style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        AI calls stay on the Next.js server via <code>/api/inkpilot</code>.
        <br />
        Click the score in the toolbar (or press <kbd>Cmd/Ctrl+Alt+P</kbd>) to review and publish.
      </footer>
    </div>
  );
}
