import { Fragment, Slice } from '@tiptap/pm/model';
import type { Node as PMNode } from '@tiptap/pm/model';
import { fragmentToRestrictedHtml } from './restricted-html';
import type { ParsedHtml } from './restricted-html';

/**
 * A range the model may rewrite. `inline` replaces part of one textblock's content;
 * `blocks` replaces whole top-level paragraphs and headings.
 */
export interface RewriteTarget {
  from: number;
  to: number;
  kind: 'inline' | 'blocks';
}

export type TargetResult = { ok: true; target: RewriteTarget } | { ok: false; reason: string };

const REWRITABLE_BLOCKS = new Set(['paragraph', 'heading']);
const ALLOWED_NODES = new Set([
  'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'text', 'hardBreak',
]);
const ALLOWED_MARKS = new Set([
  'bold', 'italic', 'underline', 'strike', 'code', 'highlight', 'textStyle', 'link',
]);

/**
 * Decide whether `from..to` can be rewritten without losing content.
 * Unsupported ranges are refused with a reason instead of being rewritten lossily.
 */
export function resolveTarget(doc: PMNode, from: number, to: number): TargetResult {
  if (from >= to) return { ok: false, reason: 'Select some text first.' };
  const $from = doc.resolve(from);
  const $to = doc.resolve(to);

  if ($from.sameParent($to) && $from.parent.isTextblock) {
    if ($from.parent.type.name === 'codeBlock') return { ok: false, reason: 'Code blocks can’t be rewritten.' };
    return { ok: true, target: { from, to, kind: 'inline' } };
  }

  // Whole top-level blocks: both ends must sit on block boundaries at the doc level.
  if ($from.depth === 0 && $to.depth === 0) {
    let supported = true;
    doc.nodesBetween(from, to, (node, pos) => {
      if (pos < from || !supported) return false;
      if (!REWRITABLE_BLOCKS.has(node.type.name)) supported = false;
      return false;
    });
    return supported
      ? { ok: true, target: { from, to, kind: 'blocks' } }
      : { ok: false, reason: 'Only paragraphs and headings can be rewritten together.' };
  }

  return { ok: false, reason: 'Select text inside one paragraph, or whole paragraphs.' };
}

/** The target's content as block nodes; inline ranges are wrapped in a copy of their textblock. */
export function targetContent(doc: PMNode, target: RewriteTarget): Fragment {
  const slice = doc.slice(target.from, target.to);
  if (target.kind === 'blocks') return slice.content;
  const parent = doc.resolve(target.from).parent;
  return Fragment.from(parent.type.create(parent.attrs, slice.content));
}

export function targetToRestrictedHtml(doc: PMNode, target: RewriteTarget): string {
  return fragmentToRestrictedHtml(doc.type.schema, targetContent(doc, target));
}

export type ProposalResult = { ok: true; content: Fragment } | { ok: false; message: string };

function disallowedIn(fragment: Fragment): string | null {
  let found: string | null = null;
  fragment.descendants((node) => {
    if (found) return false;
    if (!ALLOWED_NODES.has(node.type.name)) found = node.type.name;
    const mark = node.marks.find((m) => !ALLOWED_MARKS.has(m.type.name));
    if (mark) found = mark.type.name;
    return true;
  });
  return found;
}

/**
 * The content to insert for a finished proposal, or why it must not be accepted.
 * Formatting inside the rewritten words is part of the proposal the user reviews;
 * this only guarantees the result is safe, non-empty and fits the document.
 */
export function validateProposal(doc: PMNode, target: RewriteTarget, parsed: ParsedHtml): ProposalResult {
  if (parsed.rejection) {
    return {
      ok: false,
      message:
        parsed.rejection.reason === 'unsafe-link'
          ? 'The suggestion contained a link that isn’t allowed.'
          : `The suggestion contained content that isn’t allowed (${parsed.rejection.detail}).`,
    };
  }

  const disallowed = disallowedIn(parsed.fragment);
  if (disallowed) return { ok: false, message: `The suggestion contained content that isn’t allowed (${disallowed}).` };

  let content = parsed.fragment;
  if (target.kind === 'inline') {
    const only = content.childCount === 1 ? content.firstChild : null;
    if (!only?.isTextblock) return { ok: false, message: 'The suggestion changed the paragraph structure.' };
    content = only.content;
  }

  const proposedText = content.textBetween(0, content.size, ' ', ' ').trim();
  if (!proposedText) return { ok: false, message: 'The suggestion was empty.' };

  const originalLength = doc.textBetween(target.from, target.to, ' ', ' ').length;
  if (proposedText.length > Math.max(originalLength * 3, originalLength + 2_000)) {
    return { ok: false, message: 'The suggestion was much longer than the original.' };
  }

  try {
    doc.replace(target.from, target.to, new Slice(content, 0, 0)).check();
  } catch {
    return { ok: false, message: 'The suggestion doesn’t fit at this position.' };
  }
  return { ok: true, content };
}
