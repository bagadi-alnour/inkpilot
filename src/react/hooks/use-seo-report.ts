import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import type { SEOReport } from '@inkpilot/types';
import { getSEOReport } from '../../core/extensions/seo-report';

const EMPTY: SEOReport = { issues: [], score: 100 };

/** The live SEO report (re-run shortly after typing pauses), for your own UI. */
export function useSEOReport(editor: Editor | null): SEOReport {
  return useEditorState({ editor, selector: ({ editor: ed }) => (ed ? getSEOReport(ed.state) : EMPTY) }) ?? EMPTY;
}
