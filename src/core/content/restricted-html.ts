import { DOMParser as PMDOMParser, DOMSerializer } from '@tiptap/pm/model';
import type { Fragment, Schema } from '@tiptap/pm/model';
import { toSafeHref } from '@inkpilot/utils';

/**
 * Restricted HTML is the format content travels in to and from the model. It was
 * chosen over Markdown because it round-trips every mark and block attribute the
 * editor supports (text color and alignment have no Markdown form).
 *
 * Model output is always parsed in an inert document: parsing it with `innerHTML`
 * on the live page would let `<img onerror>` and friends run.
 */

const ALLOWED_ATTRS: Record<string, readonly string[]> = {
  a: ['href'],
  span: ['style'],
  mark: ['style', 'data-color'],
  p: ['style'],
  h1: ['style'],
  h2: ['style'],
  h3: ['style'],
  ol: ['start'],
};

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'mark', 'a', 'span', 'br',
]);

/** Elements removed with their content before parsing; their text must never become document text. */
const DROPPED_WITH_CONTENT = 'script, style, template, iframe, object, embed, noscript, svg, math';

const ALLOWED_STYLES = new Set(['color', 'text-align', 'background-color']);

export type RejectionReason = 'disallowed-element' | 'unsafe-link';

export interface ParsedHtml {
  fragment: Fragment;
  /** Why strict validation should refuse this content; null when it is clean. */
  rejection: { reason: RejectionReason; detail: string } | null;
}

function rgbToHex(value: string): string {
  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*1(?:\.0+)?\s*)?\)$/i.exec(value.trim());
  if (!match) return value.trim();
  return `#${match.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Keep only allowed declarations, with colors normalized to hex so they round-trip exactly. */
function restrictStyle(style: string): string {
  return style
    .split(';')
    .map((declaration) => {
      const colon = declaration.indexOf(':');
      if (colon < 0) return null;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      if (!ALLOWED_STYLES.has(property) || !value || /url\(|expression\(/i.test(value)) return null;
      return `${property}: ${property.endsWith('color') ? rgbToHex(value) : value}`;
    })
    .filter((declaration): declaration is string => declaration !== null)
    .join('; ');
}

/**
 * Validate a link. An already-explicit safe URL keeps its exact spelling so links
 * round-trip unchanged; anything else gets `toSafeHref`'s normalized form or null.
 */
function safeHrefPreservingOriginal(href: string): string | null {
  const safe = toSafeHref(href);
  if (!safe) return null;
  const trimmed = href.trim();
  return /^(https?:|mailto:|tel:)/i.test(trimmed) && !/\p{Cc}/u.test(trimmed) ? trimmed : safe;
}

/**
 * Strip a parsed tree down to the restricted subset in place.
 * Returns the first reason the content should be rejected under strict validation.
 */
function restrictTree(root: Element): ParsedHtml['rejection'] {
  let rejection: ParsedHtml['rejection'] = null;
  for (const element of Array.from(root.querySelectorAll(DROPPED_WITH_CONTENT))) {
    rejection ??= { reason: 'disallowed-element', detail: element.tagName.toLowerCase() };
    element.remove();
  }

  for (const element of Array.from(root.querySelectorAll('*'))) {
    const tag = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      rejection ??= { reason: 'disallowed-element', detail: tag };
    }

    const allowed = ALLOWED_ATTRS[tag] ?? [];
    for (const attr of Array.from(element.attributes)) {
      if (!allowed.includes(attr.name)) element.removeAttribute(attr.name);
    }

    const style = element.getAttribute('style');
    if (style !== null) {
      const restricted = restrictStyle(style);
      if (restricted) element.setAttribute('style', restricted);
      else element.removeAttribute('style');
    }

    if (tag === 'a') {
      const href = safeHrefPreservingOriginal(element.getAttribute('href') ?? '');
      if (href) {
        element.setAttribute('href', href);
      } else {
        rejection ??= { reason: 'unsafe-link', detail: element.getAttribute('href') ?? '' };
        element.replaceWith(...Array.from(element.childNodes));
      }
    }
  }
  return rejection;
}

function inertDocument(): Document {
  return document.implementation.createHTMLDocument('');
}

/** Serialize block content to restricted HTML for the model. */
export function fragmentToRestrictedHtml(schema: Schema, fragment: Fragment): string {
  const doc = inertDocument();
  const container = doc.createElement('div');
  container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(fragment, { document: doc }));
  restrictTree(container);
  return container.innerHTML;
}

/**
 * Parse (possibly partial) restricted HTML into block content of `schema`.
 * Unsafe parts are removed either way; `rejection` says whether any were found.
 */
export function restrictedHtmlToFragment(schema: Schema, html: string): ParsedHtml {
  const parsed = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html');
  const rejection = restrictTree(parsed.body);
  const doc = PMDOMParser.fromSchema(schema).parse(parsed.body);
  return { fragment: doc.content, rejection };
}

/** Render content for display only (previews). Never use the model's raw HTML for this. */
export function renderFragment(schema: Schema, fragment: Fragment, target: Document): Node {
  return DOMSerializer.fromSchema(schema).serializeFragment(fragment, { document: target });
}
