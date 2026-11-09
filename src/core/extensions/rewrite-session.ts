import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { Fragment } from '@tiptap/pm/model';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { Mapping } from '@tiptap/pm/transform';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';
import { PROTOCOL_VERSION } from '../../protocol';
import type { FixableIssueCode, Intent, IssueParams, SEOContext, StreamErrorCode, StreamRequest, Tone } from '../../protocol';
import type { InkpilotTransport } from '../../ai/transport';
import { renderFragment, restrictedHtmlToFragment } from '../content/restricted-html';
import { resolveTarget, targetToRestrictedHtml, validateProposal } from '../content/proposal';
import type { RewriteTarget } from '../content/proposal';
import type { RewriteResult } from '../../types/ai';

/**
 * Rewrite sessions: one AI proposal at a time, previewed in place and committed only
 * on accept (option A, "track changes").
 *
 * Guarantees, each covered by tests:
 * - Events from a cancelled or replaced session are ignored (every event carries its id).
 * - A proposal is `ready` only after a `done` event and passing validation.
 * - The range follows edits elsewhere; an edit inside it cancels the session.
 * - Accept is one isolated undo step.
 */

export type RewriteSource =
  | { type: 'issue'; issueId: string; code: FixableIssueCode; params: IssueParams }
  | { type: 'selection'; tone: Tone; intent: Intent; preserveMeaning: boolean };

export type RewriteStatus = 'streaming' | 'ready' | 'error';

export interface RewriteSession {
  id: string;
  target: RewriteTarget;
  source: RewriteSource;
  /** Restricted HTML received so far. */
  html: string;
  /** Lenient parse of `html`, for display while streaming. */
  preview: Fragment;
  status: RewriteStatus;
  /** Validated replacement content; set only when `status` is `ready`. */
  content: Fragment | null;
  error: { code: StreamErrorCode; message: string } | null;
}

export interface RewriteSessionState {
  session: RewriteSession | null;
}

type RewriteMeta =
  | { type: 'start'; session: RewriteSession }
  | { type: 'delta'; id: string; text: string }
  | { type: 'finish'; id: string }
  | { type: 'fail'; id: string; code: StreamErrorCode; message: string }
  | { type: 'clear'; id: string };

export type RewriteLabel =
  | 'streaming'
  | 'ready'
  | 'accept'
  | 'reject'
  | 'stop'
  | 'retry'
  | 'discard';

export interface RewriteSessionOptions {
  /** Current transport; undefined disables AI rewrites. Read lazily so props can change. */
  getTransport: () => InkpilotTransport | undefined;
  getContext: () => { locale: string; seo: SEOContext };
  label: (key: RewriteLabel) => string;
  /** Called when a finished proposal is accepted or rejected. */
  onSettle: (result: RewriteResult) => void;
}

export interface RewriteSessionStorage {
  controllers: Map<string, AbortController>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    rewriteSession: {
      /** Start a rewrite of `from..to`; replaces any running session. */
      startRewrite: (options: { from: number; to: number; source: RewriteSource }) => ReturnType;
      /** Rewrite the current selection in the given tone and intent. */
      rewriteSelection: (options: { tone: Tone; intent: Intent; preserveMeaning?: boolean }) => ReturnType;
      acceptRewrite: () => ReturnType;
      rejectRewrite: () => ReturnType;
      retryRewrite: () => ReturnType;
    };
  }
  interface Storage {
    rewriteSession: RewriteSessionStorage;
  }
}

export const rewriteSessionKey = new PluginKey<RewriteSessionState>('inkpilotRewriteSession');

export function getRewriteSession(state: EditorState): RewriteSession | null {
  return rewriteSessionKey.getState(state)?.session ?? null;
}

let sessionCounter = 0;
const nextSessionId = () => `rw-${Date.now().toString(36)}-${++sessionCounter}`;

/** Map a target through a transaction; null when any change touched it. */
export function mapTarget(target: RewriteTarget, mapping: Mapping): RewriteTarget | null {
  let { from, to } = target;
  for (const map of mapping.maps) {
    let touched = false;
    map.forEach((oldStart, oldEnd) => {
      if (oldStart < to && oldEnd > from) touched = true;
    });
    if (touched) return null;
    from = map.map(from, 1);
    to = map.map(to, -1);
  }
  return from < to ? { ...target, from, to } : null;
}

function parsePreview(doc: PMNode, html: string): Fragment {
  return restrictedHtmlToFragment(doc.type.schema, html).fragment;
}

function applyMeta(session: RewriteSession | null, meta: RewriteMeta, doc: PMNode): RewriteSession | null {
  if (meta.type === 'start') return meta.session;
  if (!session || session.id !== meta.id) return session;

  switch (meta.type) {
    case 'delta': {
      if (session.status !== 'streaming') return session;
      const html = session.html + meta.text;
      return { ...session, html, preview: parsePreview(doc, html) };
    }
    case 'finish': {
      if (session.status !== 'streaming') return session;
      const parsed = restrictedHtmlToFragment(doc.type.schema, session.html);
      const result = validateProposal(doc, session.target, parsed);
      return result.ok
        ? { ...session, preview: parsed.fragment, status: 'ready', content: result.content }
        : { ...session, status: 'error', error: { code: 'invalid-output', message: result.message } };
    }
    case 'fail':
      if (session.status !== 'streaming') return session;
      return { ...session, status: 'error', error: { code: meta.code, message: meta.message } };
    case 'clear':
      return null;
  }
}

function contextAround(doc: PMNode, target: RewriteTarget, size = 600): { before: string; after: string } {
  return {
    before: doc.textBetween(Math.max(0, target.from - size), target.from, '\n', '\n').slice(-size),
    after: doc.textBetween(target.to, Math.min(doc.content.size, target.to + size), '\n', '\n').slice(0, size),
  };
}

function buildRequest(doc: PMNode, target: RewriteTarget, source: RewriteSource, options: RewriteSessionOptions): StreamRequest {
  const { locale, seo } = options.getContext();
  const content: Omit<StreamRequest, 'task'> = {
    v: PROTOCOL_VERSION,
    html: targetToRestrictedHtml(doc, target),
    ...contextAround(doc, target),
    locale,
    seo,
  };
  return source.type === 'issue'
    ? { ...content, task: 'fix', issue: { code: source.code, params: source.params } }
    : { ...content, task: 'rewrite', tone: source.tone, intent: source.intent, preserveMeaning: source.preserveMeaning };
}

function settleResult(doc: PMNode, session: RewriteSession, accepted: boolean): RewriteResult {
  const { source } = session;
  return {
    original: doc.textBetween(session.target.from, session.target.to, '\n', '\n'),
    rewritten: session.preview.textBetween(0, session.preview.size, '\n', '\n'),
    accepted,
    ...(source.type === 'selection' ? { tone: source.tone, intent: source.intent } : { issueCode: source.code }),
  };
}

function dispatchMeta(editor: Editor, meta: RewriteMeta): void {
  if (editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(rewriteSessionKey, meta).setMeta('addToHistory', false));
}

/** Stream a proposal into the session `id` until a terminal event or abort. */
async function runSession(editor: Editor, storage: RewriteSessionStorage, transport: InkpilotTransport, id: string, request: StreamRequest) {
  const controller = new AbortController();
  storage.controllers.set(id, controller);
  try {
    for await (const event of transport.stream(request, controller.signal)) {
      if (controller.signal.aborted) return;
      if (event.type === 'delta') {
        dispatchMeta(editor, { type: 'delta', id, text: event.text });
      } else {
        dispatchMeta(
          editor,
          event.type === 'done' ? { type: 'finish', id } : { type: 'fail', id, code: event.code, message: event.message },
        );
        return;
      }
    }
    if (!controller.signal.aborted) {
      dispatchMeta(editor, { type: 'fail', id, code: 'incomplete', message: 'The response ended before it finished.' });
    }
  } catch {
    if (!controller.signal.aborted) {
      dispatchMeta(editor, { type: 'fail', id, code: 'network', message: 'Could not reach the writing assistant.' });
    }
  } finally {
    storage.controllers.delete(id);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className: string, text?: string) {
  const node = doc.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderProposal(view: EditorView, session: RewriteSession): HTMLElement {
  const doc = view.dom.ownerDocument;
  const schema = view.state.schema;
  if (session.target.kind === 'inline') {
    const wrapper = el(doc, 'span', 'ip-rewrite-proposal');
    // Inline targets show the textblocks' inline content; extra blocks (invalid) render joined.
    session.preview.forEach((block, _offset, index) => {
      if (index > 0) wrapper.append(' ');
      wrapper.append(renderFragment(schema, block.isTextblock ? block.content : Fragment.from(block), doc));
    });
    if (session.status === 'streaming') wrapper.append(el(doc, 'span', 'ip-rewrite-caret'));
    return wrapper;
  }
  const wrapper = el(doc, 'div', 'ip-rewrite-proposal ip-rewrite-proposal--blocks');
  wrapper.append(renderFragment(schema, session.preview, doc));
  if (session.status === 'streaming') wrapper.append(el(doc, 'span', 'ip-rewrite-caret'));
  return wrapper;
}

function renderBar(editor: Editor, session: RewriteSession, label: RewriteSessionOptions['label']): HTMLElement {
  const doc = editor.view.dom.ownerDocument;
  const bar = el(doc, 'div', `ip-rewrite-bar ip-rewrite-bar--${session.status}`);
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', label('ready'));
  bar.contentEditable = 'false';

  const status = el(doc, 'span', 'ip-rewrite-status');
  status.setAttribute('role', 'status');
  status.append(el(doc, 'span', 'ip-rewrite-dot'));
  status.append(
    session.status === 'error' ? (session.error?.message ?? '') : label(session.status === 'streaming' ? 'streaming' : 'ready'),
  );
  bar.append(status);

  const button = (text: string, onClick: () => void, opts: { primary?: boolean; disabled?: boolean; kbd?: string } = {}) => {
    const b = el(doc, 'button', `ip-btn${opts.primary ? ' ip-btn--primary' : ''}`);
    b.type = 'button';
    b.append(text);
    if (opts.kbd) b.append(el(doc, 'kbd', '', opts.kbd));
    b.disabled = !!opts.disabled;
    // Keep focus and selection in the editor; handlers also re-focus it so Enter/Esc keep working.
    b.addEventListener('mousedown', (event) => event.preventDefault());
    b.addEventListener('click', onClick);
    bar.append(b);
  };

  if (session.status === 'error') {
    button(label('retry'), () => editor.chain().focus().retryRewrite().run(), { primary: true });
    button(label('discard'), () => editor.chain().focus().rejectRewrite().run(), { kbd: 'Esc' });
  } else {
    const streaming = session.status === 'streaming';
    button(label('accept'), () => editor.chain().focus().acceptRewrite().run(), { primary: true, disabled: streaming, kbd: '↵' });
    button(streaming ? label('stop') : label('reject'), () => editor.chain().focus().rejectRewrite().run(), { kbd: 'Esc' });
    if (!streaming) button(label('retry'), () => editor.chain().focus().retryRewrite().run());
  }
  return bar;
}

function buildDecorations(editor: Editor, state: EditorState, options: RewriteSessionOptions): DecorationSet {
  const session = getRewriteSession(state);
  if (!session) return DecorationSet.empty;
  const { from, to, kind } = session.target;
  const decorations: Decoration[] = [];

  if (kind === 'inline') {
    decorations.push(Decoration.inline(from, to, { class: 'ip-rewrite-original' }));
  } else {
    state.doc.nodesBetween(from, to, (node, pos) => {
      decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'ip-rewrite-original-block' }));
      return false;
    });
  }

  const previewKey = `ip-proposal-${session.id}-${session.status}-${session.html.length}`;
  decorations.push(
    Decoration.widget(to, (view) => renderProposal(view, session), { side: 1, key: previewKey, ignoreSelection: true }),
  );

  const $to = state.doc.resolve(to);
  const barPos = kind === 'inline' ? $to.after($to.depth) : to;
  const barKey = `ip-bar-${session.id}-${session.status}-${session.error?.code ?? ''}`;
  decorations.push(
    Decoration.widget(barPos, () => renderBar(editor, session, options.label), {
      side: 2,
      key: barKey,
      ignoreSelection: true,
      stopEvent: () => true,
    }),
  );
  return DecorationSet.create(state.doc, decorations);
}

export const RewriteSessionExtension = Extension.create<RewriteSessionOptions, RewriteSessionStorage>({
  name: 'rewriteSession',

  addOptions() {
    return {
      getTransport: () => undefined,
      getContext: () => ({ locale: 'en', seo: { keywords: [] } }),
      label: (key) => key,
      onSettle: () => undefined,
    };
  },

  addStorage() {
    return { controllers: new Map<string, AbortController>() };
  },

  onDestroy() {
    for (const controller of this.storage.controllers.values()) controller.abort();
    this.storage.controllers.clear();
  },

  addCommands() {
    const options = this.options;
    const storage = this.storage;

    const start = (editor: Editor, target: RewriteTarget, source: RewriteSource, tr: Transaction): boolean => {
      const transport = options.getTransport();
      if (!transport) return false;
      const session: RewriteSession = {
        id: nextSessionId(),
        target,
        source,
        html: '',
        preview: Fragment.empty,
        status: 'streaming',
        content: null,
        error: null,
      };
      const request = buildRequest(tr.doc, target, source, options);
      tr.setMeta(rewriteSessionKey, { type: 'start', session } satisfies RewriteMeta).setMeta('addToHistory', false);
      // Let the start transaction land before the first event arrives.
      queueMicrotask(() => void runSession(editor, storage, transport, session.id, request));
      return true;
    };

    return {
      startRewrite:
        ({ from, to, source }) =>
        ({ editor, tr, dispatch }) => {
          const resolved = resolveTarget(tr.doc, from, to);
          if (!resolved.ok || !options.getTransport()) return false;
          if (!dispatch) return true;
          return start(editor, resolved.target, source, tr);
        },

      rewriteSelection:
        ({ tone, intent, preserveMeaning = true }) =>
        ({ editor, tr, dispatch }) => {
          const { from, to } = tr.selection;
          const resolved = resolveTarget(tr.doc, from, to);
          if (!resolved.ok || !options.getTransport()) return false;
          if (!dispatch) return true;
          // Collapse the selection so its highlight doesn't hide the struck-through original.
          tr.setSelection(TextSelection.create(tr.doc, resolved.target.to));
          return start(editor, resolved.target, { type: 'selection', tone, intent, preserveMeaning }, tr);
        },

      retryRewrite:
        () =>
        ({ editor, tr, dispatch }) => {
          const session = getRewriteSession(editor.state);
          if (!session || session.status === 'streaming') return false;
          if (!dispatch) return true;
          return start(editor, session.target, session.source, tr);
        },

      rejectRewrite:
        () =>
        ({ editor, tr, dispatch }) => {
          const session = getRewriteSession(editor.state);
          if (!session) return false;
          if (dispatch) {
            if (session.status === 'ready') options.onSettle(settleResult(tr.doc, session, false));
            tr.setMeta(rewriteSessionKey, { type: 'clear', id: session.id } satisfies RewriteMeta).setMeta('addToHistory', false);
          }
          return true;
        },

      acceptRewrite:
        () =>
        ({ editor, tr, dispatch }) => {
          const session = getRewriteSession(editor.state);
          if (!session || session.status !== 'ready' || !session.content) return false;
          if (!dispatch) return true;
          const { from, to } = session.target;
          options.onSettle(settleResult(tr.doc, session, true));
          tr.replaceWith(from, to, session.content);
          tr.setMeta(rewriteSessionKey, { type: 'clear', id: session.id } satisfies RewriteMeta);
          // Own undo event: closed before (no merge with earlier typing) and after (below).
          closeHistory(tr);
          tr.scrollIntoView();
          queueMicrotask(() => {
            if (!editor.isDestroyed) editor.view.dispatch(closeHistory(editor.state.tr));
          });
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;
    const storage = this.storage;

    return [
      new Plugin<RewriteSessionState>({
        key: rewriteSessionKey,
        state: {
          init: () => ({ session: null }),
          apply(tr, value, _old, newState) {
            const meta = tr.getMeta(rewriteSessionKey) as RewriteMeta | undefined;
            let session = value.session;
            if (session && tr.docChanged && meta?.type !== 'clear') {
              const target = mapTarget(session.target, tr.mapping);
              session = target ? { ...session, target } : null;
            }
            if (meta) session = applyMeta(session, meta, newState.doc);
            return session === value.session ? value : { session };
          },
        },
        view: () => ({
          update(view, prevState) {
            const prev = getRewriteSession(prevState);
            const next = getRewriteSession(view.state);
            if (prev && prev.id !== next?.id) {
              storage.controllers.get(prev.id)?.abort();
              storage.controllers.delete(prev.id);
            }
          },
        }),
        props: {
          decorations: (state) => buildDecorations(editor, state, options),
          handleKeyDown(view, event) {
            const session = getRewriteSession(view.state);
            if (!session || event.isComposing) return false;
            if (event.key === 'Escape') {
              editor.commands.rejectRewrite();
              return true;
            }
            const plainEnter = event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey;
            if (plainEnter && session.status === 'ready') {
              editor.commands.acceptRewrite();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
