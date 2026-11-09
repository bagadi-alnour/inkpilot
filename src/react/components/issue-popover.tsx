import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { useTranslation } from '@inkpilot/i18n';
import { findIssue } from '../../core/extensions/seo-report';

interface IssuePopoverProps {
  editor: Editor | null;
  /** Positioned ancestor the popover is placed in. */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether an AI transport is configured. */
  canFix: boolean;
}

interface Anchor {
  id: string;
  top: number;
  left: number;
}

const HIDE_DELAY_MS = 250;
const POPOVER_WIDTH = 300;

/**
 * Hovering an underlined issue shows what's wrong with Fix with AI and Ignore
 * (design option A). The publish panel offers the same actions by keyboard.
 */
export function IssuePopover({ editor, containerRef, canFix }: IssuePopoverProps) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const issue = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed && anchor ? (findIssue(ed.state, anchor.id) ?? null) : null),
  });

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const scheduleHide = () => {
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setAnchor(null), HIDE_DELAY_MS);
    };
    const show = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.('[data-ip-issue]');
      const container = containerRef.current;
      if (!target || !container) {
        scheduleHide();
        return;
      }
      clearTimeout(hideTimer.current);
      const rect = target.getBoundingClientRect();
      const box = container.getBoundingClientRect();
      setAnchor({
        id: target.getAttribute('data-ip-issue') ?? '',
        top: rect.bottom - box.top + 6,
        left: Math.max(0, Math.min(rect.left - box.left, box.width - POPOVER_WIDTH)),
      });
    };

    dom.addEventListener('mouseover', show);
    dom.addEventListener('mouseleave', scheduleHide);
    return () => {
      dom.removeEventListener('mouseover', show);
      dom.removeEventListener('mouseleave', scheduleHide);
      clearTimeout(hideTimer.current);
    };
  }, [editor, containerRef]);

  if (!editor || !anchor || !issue) return null;

  const close = () => setAnchor(null);
  return (
    <div
      className="ip-issue-popover"
      role="dialog"
      aria-label={t(`seo.issue.${issue.code}`)}
      style={{ top: anchor.top, left: anchor.left, width: POPOVER_WIDTH }}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={() => setAnchor(null)}
    >
      <p>
        <strong>{t(`seo.issue.${issue.code}`)}.</strong> {t(`seo.issue.${issue.code}.detail`, issue.params)}
      </p>
      <div className="ip-issue-popover-actions">
        {canFix && editor.can().fixIssue(issue.id) && (
          <button
            type="button"
            className="ip-btn ip-btn--primary"
            onClick={() => {
              // Focus first so Enter / Esc reach the rewrite preview.
              editor.chain().focus().fixIssue(issue.id).run();
              close();
            }}
          >
            {t('seo.issue.fix')}
          </button>
        )}
        <button
          type="button"
          className="ip-btn"
          onClick={() => {
            editor.chain().focus().ignoreIssue(issue.id).run();
            close();
          }}
        >
          {t('seo.issue.ignore')}
        </button>
      </div>
    </div>
  );
}
