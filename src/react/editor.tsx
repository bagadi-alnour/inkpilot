import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { EditorContent, useEditorState } from '@tiptap/react';
import type { EditorConfig, PublishMeta } from '@inkpilot/types';
import { I18nContext, createI18nValue } from '@inkpilot/i18n';
import { createFetchTransport } from '../ai/transport';
import type { InkpilotTransport } from '../ai/transport';
import { takePublishSnapshot } from '../core/publish';
import { firstH1 } from '../seo/engine/blocks';
import { slugify } from '../seo/slug';
import { InkpilotContext } from './context';
import { useInkpilotEditor } from './hooks/use-editor';
import { useTheme } from './hooks/use-theme';
import { analyzeContextFrom } from './seo-context';
import { Toolbar } from './components/toolbar';
import { FloatingToolbar } from './components/floating-toolbar';
import { ScoreBadge } from './components/score-badge';
import { IssuePopover } from './components/issue-popover';
import { PublishDrawer } from './components/publish-drawer';
import '../theme/styles.css';

export interface EditorProps extends EditorConfig {
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

export function Editor(props: EditorProps) {
  const {
    ai,
    seo,
    theme,
    i18n: i18nConfig,
    locale,
    content,
    defaultMeta,
    onMetaChange,
    onChange,
    onPublish,
    className,
    style,
    readOnly,
    autoFocus,
    placeholder,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<() => void>(() => undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const panelEnabled = seo?.prePublishPanel !== false;

  // Read lazily by the editor's extensions, so a new object per render is fine.
  const transport = useMemo((): InkpilotTransport | undefined => {
    if (!ai) return undefined;
    if (ai.transport) return ai.transport;
    return createFetchTransport({ endpoint: ai.endpoint, headers: ai.headers });
  }, [ai]);

  const i18nValue = useMemo(
    () => createI18nValue(locale ?? i18nConfig?.locale ?? 'en', i18nConfig?.translations),
    [locale, i18nConfig],
  );

  // Search metadata. The slug follows the title until the writer edits it.
  const [meta, setMeta] = useState<PublishMeta>(() => ({ title: '', description: '', slug: '', ...defaultMeta }));
  const [slugEdited, setSlugEdited] = useState(() => !!defaultMeta?.slug);
  // The engine checks the description only when the panel that edits it exists.
  const engineMeta = useMemo(
    () => (panelEnabled ? { title: meta.title, description: meta.description } : undefined),
    [panelEnabled, meta.title, meta.description],
  );

  const { editor } = useInkpilotEditor({
    ai,
    transport,
    meta: engineMeta,
    rewriteLabel: (key) => i18nValue.t(`rewrite.${key}`),
    locale,
    seo,
    image: props.image,
    codeBlock: props.codeBlock,
    content,
    onChange,
    placeholder,
    autoFocus,
    readOnly,
    // Called lazily from the shortcut, after `editor` above is initialized.
    onRewrite: () =>
      editor
        ?.chain()
        .focus()
        .rewriteSelection({
          tone: ai?.defaultTone ?? 'casual',
          intent: ai?.defaultIntent ?? 'clarify',
          preserveMeaning: ai?.preserveMeaning,
        })
        .run(),
    onPublish: () => publishRef.current(),
  });

  const { theme: resolvedTheme } = useTheme(theme, containerRef);
  const h1 = useEditorState({ editor, selector: ({ editor: ed }) => (ed ? (firstH1(ed.state.doc)?.text.trim() ?? '') : '') }) ?? '';
  const effectiveMeta = useMemo(
    (): PublishMeta => (slugEdited ? meta : { ...meta, slug: slugify(meta.title || h1) }),
    [meta, slugEdited, h1],
  );

  const onMetaChangeRef = useRef(onMetaChange);
  onMetaChangeRef.current = onMetaChange;
  const metaKey = JSON.stringify(effectiveMeta);
  useEffect(() => {
    onMetaChangeRef.current?.(effectiveMeta);
    // `metaKey` captures every field; the object identity changes more often.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaKey]);

  const updateMeta = useCallback((patch: Partial<PublishMeta>) => {
    if (patch.slug !== undefined) setSlugEdited(true);
    setMeta((previous) => ({ ...previous, ...patch }));
  }, []);

  const keywordsKey = seo?.keywords?.join('\u0000') ?? '';
  useEffect(() => {
    // Locale, keywords and metadata feed the analysis; re-run it when they change.
    editor?.commands.refreshReport();
  }, [editor, locale, keywordsKey, engineMeta]);

  /** Publish exactly what is in the editor now, with the analysis of that content. */
  const publish = useCallback(() => {
    if (!editor) return;
    const snapshot = takePublishSnapshot(editor, analyzeContextFrom({ locale, seo, meta: engineMeta }));
    if (!snapshot.ok) {
      const key = snapshot.reason === 'uploading' ? 'publish.uploading' : 'publish.localImage';
      setBlockedMessage(i18nValue.t(key, { count: snapshot.count }));
      return;
    }
    setBlockedMessage(null);
    onPublish?.({ content: snapshot.content, meta: effectiveMeta, report: snapshot.report });
    setDrawerOpen(false);
  }, [editor, locale, seo, engineMeta, effectiveMeta, onPublish, i18nValue]);

  publishRef.current = () => {
    if (panelEnabled) setDrawerOpen(true);
    else publish();
  };

  const handleImageInsert = useCallback(
    (file: File) => {
      editor?.chain().focus().insertImageFiles([file]).run();
    },
    [editor],
  );

  const ctxValue = useMemo(() => ({ editor, aiConfig: ai, seoConfig: seo, themeConfig: theme }), [editor, ai, seo, theme]);

  const scoreBadge =
    seo?.liveSignals !== false ? (
      <ScoreBadge editor={editor} onClick={panelEnabled && !readOnly ? () => setDrawerOpen((open) => !open) : undefined} />
    ) : undefined;

  return (
    <I18nContext.Provider value={i18nValue}>
      <InkpilotContext.Provider value={ctxValue}>
        <div
          ref={containerRef}
          className={`inkpilot-editor${className ? ` ${className}` : ''}`}
          style={style}
          data-wf-theme={resolvedTheme.mode}
        >
          {!readOnly && (
            <Toolbar editor={editor} onImageInsert={handleImageInsert} themeMode={resolvedTheme.mode} trailing={scoreBadge} />
          )}

          <div className={`ip-body${drawerOpen && editor ? ' ip-body--drawer' : ''}`}>
            <div ref={contentRef} className="ip-content">
              {editor && <EditorContent editor={editor} />}

              {!readOnly && <IssuePopover editor={editor} containerRef={contentRef} canFix={!!transport} />}

              {!readOnly && (
                <FloatingToolbar editor={editor} enabled={!!transport} defaultTone={ai?.defaultTone} defaultIntent={ai?.defaultIntent} />
              )}
            </div>

            {drawerOpen && editor && (
              <PublishDrawer
                editor={editor}
                meta={effectiveMeta}
                h1={h1}
                onMetaChange={updateMeta}
                transport={transport}
                locale={seo?.locale ?? locale ?? 'en'}
                keywords={seo?.keywords ?? []}
                baseUrl={seo?.baseUrl}
                rules={seo?.rules}
                blockedMessage={blockedMessage}
                onPublish={publish}
                onClose={() => setDrawerOpen(false)}
              />
            )}
          </div>
        </div>
      </InkpilotContext.Provider>
    </I18nContext.Provider>
  );
}
