'use client';

import { useMemo, useState } from 'react';
import { Editor, useAIRewrite, useSEOReport } from '@inkpilot/editor';
import type { AIConfig, PublishPayload, RewriteResult } from '@inkpilot/editor';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { articleHtml, EDITOR_TRANSLATIONS, SHELL } from '@/lib/content';
import type { DemoLang } from '@/lib/content';

interface DemoProps {
  theme: 'dark' | 'light';
  lang: DemoLang;
  /** Real AI provider in use, or null for the scripted model. */
  provider: string | null;
}

type Step = 0 | 1 | 2 | 3;

/**
 * The guided loop: four steps beside the editor. Each step drives the editor through
 * its public commands, so the page doubles as an example of controlling `<Editor />`.
 */
export function Demo({ theme, lang, provider }: DemoProps) {
  const text = SHELL[lang];
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  // Remounting the editor is the reset: seeded content, no proposal, panel closed.
  const [round, setRound] = useState(0);
  const [reached, setReached] = useState<Step>(0);
  const [published, setPublished] = useState<string | null>(null);

  const report = useSEOReport(editor);
  const { session, accept } = useAIRewrite(editor);
  const longSentence = report.issues.find((issue) => issue.code === 'long-sentence');

  const content = useMemo(() => ({ html: articleHtml(lang) }), [lang]);
  const ai = useMemo(
    (): AIConfig => ({
      endpoint: '/api/inkpilot',
      onRewrite: (result: RewriteResult) => {
        if (result.accepted) setReached(2);
      },
    }),
    [],
  );
  const i18n = useMemo(() => ({ translations: EDITOR_TRANSLATIONS[lang] }), [lang]);

  // A proposal on screen means step 2, whichever way it was started.
  const current: Step = session ? 1 : reached;

  const actions: { run: () => void; enabled: boolean }[] = [
    {
      run: () => {
        setEditor(null);
        setReached(0);
        setPublished(null);
        setRound((value) => value + 1);
      },
      enabled: true,
    },
    {
      run: () => {
        if (longSentence) editor?.chain().focus().fixIssue(longSentence.id).run();
      },
      enabled: !!longSentence && !session,
    },
    {
      run: () => {
        editor?.commands.focus();
        accept();
      },
      enabled: session?.status === 'ready',
    },
    {
      run: () => {
        editor?.commands.requestPublish();
        setReached(3);
      },
      enabled: !!editor,
    },
  ];

  const handlePublish = ({ meta, report: finalReport }: PublishPayload) => {
    setPublished(text.published(meta.title || meta.slug, finalReport.score));
  };

  const otherTheme = theme === 'dark' ? 'light' : 'dark';
  const otherLang: DemoLang = lang === 'en' ? 'ar' : 'en';

  return (
    <div className="demo" data-theme={theme} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
      <aside className="demo-steps">
        <p className="demo-mark">
          <span aria-hidden />
          Inkpilot
        </p>
        <h1>{text.loopTitle}</h1>
        <p className="demo-intro">{text.loopIntro}</p>

        <ol className="demo-step-list">
          {text.steps.map(([title, detail], index) => (
            <li key={title}>
              <button
                type="button"
                className="demo-step"
                aria-current={current === index ? 'step' : undefined}
                disabled={!actions[index].enabled}
                onClick={actions[index].run}
              >
                <span className="demo-step-n" aria-hidden>
                  {index + 1}
                </span>
                <span>
                  <strong>{title}</strong>
                  <span className="demo-step-detail">{detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {published && (
          <p className="demo-published" role="status">
            {published}
          </p>
        )}

        <div className="demo-foot">
          <p>{provider ? text.realModel(provider) : text.scripted}</p>
          <p className="demo-switches">
            <a href={`?theme=${otherTheme}&lang=${lang}`}>{text.otherTheme[theme]}</a>
            <a href={`?theme=${theme}&lang=${otherLang}`} lang={otherLang}>
              {text.otherLang}
            </a>
            <a href="https://github.com/bagadi-alnour/inkpilot">GitHub</a>
          </p>
        </div>
      </aside>

      <main className="demo-main">
        <Editor
          key={`${lang}-${round}`}
          content={content}
          ai={ai}
          theme={{ mode: theme }}
          locale={lang}
          i18n={i18n}
          onReady={setEditor}
          onPublish={handlePublish}
        />
      </main>
    </div>
  );
}
