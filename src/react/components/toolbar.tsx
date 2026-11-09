import { useRef, useCallback, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useTranslation } from '@inkpilot/i18n';
import { toSafeHref } from '@inkpilot/utils';

interface ToolbarProps {
  editor: Editor | null;
  onImageInsert?: (file: File) => void | Promise<void>;
  /** Resolved light/dark — active tool styling is inlined so nothing can force blue */
  themeMode?: 'light' | 'dark';
  /** Rendered at the end of the toolbar (e.g. the score badge). */
  trailing?: ReactNode;
}

function activeButtonStyle(mode: 'light' | 'dark'): CSSProperties {
  if (mode === 'dark') {
    return {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      WebkitTextFillColor: '#0f172a',
      border: '1px solid #e2e8f0',
    };
  }
  return {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    WebkitTextFillColor: '#ffffff',
    border: '1px solid #0f172a',
  };
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  disabled,
  themeMode,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  disabled?: boolean;
  themeMode: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const activeStyle = useMemo(
    () => (isActive ? activeButtonStyle(themeMode) : undefined),
    [isActive, themeMode],
  );

  return (
    <button
      type="button"
      className={`wf-toolbar-btn${isActive ? ' is-active' : ''}`}
      style={activeStyle}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="wf-toolbar-separator" role="separator" />;
}

export function Toolbar({ editor, onImageInsert, themeMode = 'light', trailing }: ToolbarProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tiptap v3 no longer re-renders on every transaction, so active states are
  // read through a selector that updates on selection changes too.
  const active = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      return {
        bold: ed.isActive('bold'),
        italic: ed.isActive('italic'),
        underline: ed.isActive('underline'),
        strike: ed.isActive('strike'),
        h1: ed.isActive('heading', { level: 1 }),
        h2: ed.isActive('heading', { level: 2 }),
        h3: ed.isActive('heading', { level: 3 }),
        bulletList: ed.isActive('bulletList'),
        orderedList: ed.isActive('orderedList'),
        blockquote: ed.isActive('blockquote'),
        codeBlock: ed.isActive('codeBlock'),
        link: ed.isActive('link'),
        alignLeft: ed.isActive({ textAlign: 'left' }),
        alignCenter: ed.isActive({ textAlign: 'center' }),
        alignRight: ed.isActive({ textAlign: 'right' }),
      };
    },
  });

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageInsert) {
        void onImageInsert(file);
      }
      e.target.value = '';
    },
    [onImageInsert],
  );

  if (!editor) return null;

  return (
    <div className="wf-toolbar" role="toolbar" aria-label="Formatting tools">
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={active?.bold}
        title={t('toolbar.bold')}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={active?.italic}
        title={t('toolbar.italic')}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={active?.underline}
        title={t('toolbar.underline')}
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={active?.strike}
        title={t('toolbar.strikethrough')}
      >
        <s>S</s>
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={active?.h1}
        title={t('toolbar.heading1')}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={active?.h2}
        title={t('toolbar.heading2')}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={active?.h3}
        title={t('toolbar.heading3')}
      >
        H3
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={active?.bulletList}
        title={t('toolbar.bulletList')}
      >
        &bull;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={active?.orderedList}
        title={t('toolbar.orderedList')}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={active?.blockquote}
        title={t('toolbar.blockquote')}
      >
        &ldquo;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={active?.codeBlock}
        title={t('toolbar.codeBlock')}
      >
        {'</>'}
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        themeMode={themeMode}
        onClick={() => {
          const prev = editor.getAttributes('link').href as string | undefined;
          const href = typeof window !== 'undefined' ? window.prompt('URL', prev ?? 'https://') : null;
          if (href === null) return;
          if (href.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          const safeHref = toSafeHref(href);
          // Rejected scheme: leave the document untouched rather than write an
          // href the renderer would have to strip.
          if (!safeHref) return;
          editor.chain().focus().extendMarkRange('link').setLink({ href: safeHref }).run();
        }}
        isActive={active?.link}
        title={t('toolbar.link')}
      >
        &#128279;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={active?.alignLeft}
        title={t('toolbar.alignLeft')}
      >
        &#8676;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={active?.alignCenter}
        title={t('toolbar.alignCenter')}
      >
        &#8596;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={active?.alignRight}
        title={t('toolbar.alignRight')}
      >
        &#8677;
      </ToolbarButton>

      <Separator />

      <ToolbarButton themeMode={themeMode} onClick={handleImageClick} title={t('toolbar.image')}>
        &#128247;
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <Separator />

      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().undo().run()}
        title={t('toolbar.undo')}
      >
        &#8617;
      </ToolbarButton>
      <ToolbarButton
        themeMode={themeMode}
        onClick={() => editor.chain().focus().redo().run()}
        title={t('toolbar.redo')}
      >
        &#8618;
      </ToolbarButton>
      {trailing && <span className="ip-toolbar-trailing">{trailing}</span>}
    </div>
  );
}
