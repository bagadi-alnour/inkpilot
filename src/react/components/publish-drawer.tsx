import { useId, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import type { PublishMeta, SEOIssue } from '@inkpilot/types';
import { useTranslation } from '@inkpilot/i18n';
import { getSEOReport } from '../../core/extensions/seo-report';
import { pendingUploads } from '../../core/extensions/image-upload';
import { summarizeArticle } from '../../core/content/article';
import { PROTOCOL_VERSION } from '../../protocol';
import type { InkpilotTransport } from '../../ai/transport';
import { DEFAULT_RULE_OPTIONS } from '../../seo/engine';
import type { RuleOptions } from '../../seo/engine';

interface PublishDrawerProps {
  editor: Editor;
  meta: PublishMeta;
  /** The H1, shown when no SEO title is set. */
  h1: string;
  onMetaChange: (patch: Partial<PublishMeta>) => void;
  transport?: InkpilotTransport;
  locale: string;
  keywords: string[];
  baseUrl?: string;
  rules?: Partial<RuleOptions>;
  /** Why the last publish attempt was refused, if it was. */
  blockedMessage: string | null;
  onPublish: () => void;
  onClose: () => void;
}

type SuggestionState = { status: 'idle' } | { status: 'loading' } | { status: 'done'; items: string[] } | { status: 'error'; message: string };

const SEVERITY_ICON: Record<SEOIssue['severity'], string> = { error: '✕', warning: '!', info: 'i' };

/**
 * Review and publish (design option A): a side drawer that keeps the article in view.
 * Checks first, then search appearance, with Publish pinned at the bottom.
 * AI suggestions run only when asked for.
 */
export function PublishDrawer(props: PublishDrawerProps) {
  const { editor, meta, h1, onMetaChange, transport, locale, keywords, baseUrl, rules, blockedMessage, onPublish, onClose } = props;
  const { t } = useTranslation();
  const ids = useId();
  const [titles, setTitles] = useState<SuggestionState>({ status: 'idle' });
  const [descriptions, setDescriptions] = useState<SuggestionState>({ status: 'idle' });

  const { report, uploading } = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      report: getSEOReport(ed.state),
      uploading: pendingUploads(ed.state, ed.storage.imageUpload).length,
    }),
  });

  const lengths = { ...DEFAULT_RULE_OPTIONS, ...rules };
  const title = meta.title || h1;

  const suggest = async (task: 'titles' | 'descriptions') => {
    if (!transport) return;
    const set = task === 'titles' ? setTitles : setDescriptions;
    set({ status: 'loading' });
    const article = { v: PROTOCOL_VERSION, locale, seo: { keywords }, ...summarizeArticle(editor.state.doc), title } as const;
    const signal = new AbortController().signal;
    if (task === 'titles') {
      const result = await transport.json({ ...article, task: 'titles' }, signal);
      setTitles(result.ok ? { status: 'done', items: result.data.titles } : { status: 'error', message: result.message });
    } else {
      const result = await transport.json({ ...article, task: 'descriptions' }, signal);
      setDescriptions(result.ok ? { status: 'done', items: result.data.descriptions } : { status: 'error', message: result.message });
    }
  };

  const show = (issue: SEOIssue) => {
    if (issue.range) editor.chain().focus().setTextSelection(issue.range).scrollIntoView().run();
  };

  const issueAction = (issue: SEOIssue) => {
    if (editor.can().fixIssue(issue.id)) {
      return (
        <button type="button" className="ip-btn" onClick={() => editor.chain().focus().fixIssue(issue.id).run()}>
          {t('publish.fix')}
        </button>
      );
    }
    if (transport && (issue.fix === 'ai-title' || issue.fix === 'ai-description')) {
      const task = issue.fix === 'ai-title' ? 'titles' : 'descriptions';
      return (
        <button type="button" className="ip-btn" onClick={() => void suggest(task)}>
          {t('publish.suggest')}
        </button>
      );
    }
    if (issue.range) {
      return (
        <button type="button" className="ip-btn" onClick={() => show(issue)}>
          {t('publish.show')}
        </button>
      );
    }
    return null;
  };

  const counter = (length: number, range: { min: number; max: number }) => (
    <span className={`ip-count${length && (length < range.min || length > range.max) ? ' ip-count--off' : ''}`}>
      {length} / {range.max}
    </span>
  );

  const suggestions = (state: SuggestionState, apply: (value: string) => void) => {
    if (state.status === 'loading') return <p className="ip-drawer-note" role="status">{t('publish.suggesting')}</p>;
    if (state.status === 'error') return <p className="ip-drawer-note ip-drawer-note--error" role="alert">{t('publish.suggestFailed', { message: state.message })}</p>;
    if (state.status !== 'done') return null;
    return (
      <div className="ip-suggestions">
        {state.items.map((item) => (
          <button key={item} type="button" className="ip-suggestion" onClick={() => apply(item)} title={t('publish.useSuggestion')}>
            {item}
          </button>
        ))}
      </div>
    );
  };

  const url = `${baseUrl ?? 'https://example.com/'}${meta.slug}`;
  const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

  return (
    <aside className="ip-drawer" aria-labelledby={`${ids}-title`}>
      <div className="ip-drawer-head">
        <h2 id={`${ids}-title`}>{t('publish.title')}</h2>
        <button type="button" className="ip-btn ip-btn--icon" onClick={onClose} aria-label={t('publish.close')}>
          ✕
        </button>
      </div>

      <div className="ip-drawer-body">
        <div className="ip-drawer-score">
          <strong>{report.score}</strong>
          <span>{t('publish.scoreOf')}</span>
        </div>

        <h3>{report.issues.length ? t('publish.checks', { count: report.issues.length }) : t('publish.noChecks')}</h3>
        <ul className="ip-checks">
          {report.issues.map((issue) => (
            <li key={issue.id} className="ip-check">
              <span className={`ip-sev ip-sev--${issue.severity}`} aria-hidden>
                {SEVERITY_ICON[issue.severity]}
              </span>
              <div>
                <strong>{t(`seo.issue.${issue.code}`)}</strong>
                <span>{t(`seo.issue.${issue.code}.detail`, issue.params)}</span>
              </div>
              {issueAction(issue)}
            </li>
          ))}
        </ul>

        <h3>{t('publish.searchAppearance')}</h3>
        <div className="ip-field">
          <label htmlFor={`${ids}-seo-title`}>
            {t('publish.seoTitle')} {counter(title.length, lengths.titleLength)}
          </label>
          <input
            id={`${ids}-seo-title`}
            className="ip-input"
            value={meta.title}
            placeholder={h1 || t('publish.seoTitlePlaceholder')}
            onChange={(event) => onMetaChange({ title: event.target.value })}
          />
          {transport && titles.status !== 'loading' && (
            <button type="button" className="ip-btn ip-btn--quiet" onClick={() => void suggest('titles')}>
              {t('publish.suggestTitles')}
            </button>
          )}
          {suggestions(titles, (value) => onMetaChange({ title: value }))}
        </div>

        <div className="ip-field">
          <label htmlFor={`${ids}-description`}>
            {t('publish.description')} {counter(meta.description.length, lengths.descriptionLength)}
          </label>
          <textarea
            id={`${ids}-description`}
            className="ip-input ip-input--area"
            value={meta.description}
            onChange={(event) => onMetaChange({ description: event.target.value })}
          />
          {transport && descriptions.status !== 'loading' && (
            <button type="button" className="ip-btn ip-btn--quiet" onClick={() => void suggest('descriptions')}>
              {t('publish.suggestDescriptions')}
            </button>
          )}
          {suggestions(descriptions, (value) => onMetaChange({ description: value }))}
        </div>

        <div className="ip-field">
          <label htmlFor={`${ids}-slug`}>{t('publish.slug')}</label>
          <div className="ip-slug">
            <span dir="ltr">{baseUrl ?? 'https://example.com/'}</span>
            <input id={`${ids}-slug`} dir="ltr" className="ip-input" value={meta.slug} onChange={(event) => onMetaChange({ slug: event.target.value })} />
          </div>
        </div>

        <div className="ip-serp" aria-label="Search result preview">
          <div className="ip-serp-url" dir="ltr">{url}</div>
          <div className="ip-serp-title">{clip(title || '—', lengths.titleLength.max + 3)}</div>
          <div className="ip-serp-description">{clip(meta.description || summarizeArticle(editor.state.doc, 300).excerpt, lengths.descriptionLength.max + 3)}</div>
        </div>
        <p className="ip-drawer-note">{t('publish.serpNote')}</p>
      </div>

      <div className="ip-drawer-foot">
        {blockedMessage && <p className="ip-drawer-note ip-drawer-note--error" role="alert">{blockedMessage}</p>}
        {uploading > 0 ? (
          <button type="button" className="ip-btn ip-btn--primary ip-btn--wide" disabled>
            <span className="ip-spinner" aria-hidden /> {t('publish.uploading', { count: uploading })}
          </button>
        ) : (
          <button type="button" className="ip-btn ip-btn--primary ip-btn--wide" onClick={onPublish}>
            {t('publish.publish')}
          </button>
        )}
      </div>
    </aside>
  );
}
