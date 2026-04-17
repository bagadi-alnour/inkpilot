import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { SEOSignal } from '@writeflow/types';

export interface SEOSignalsOptions {
  enabled: boolean;
  onSignalsUpdate?: (signals: SEOSignal[]) => void;
}

const seoSignalsPluginKey = new PluginKey('seoSignals');

function computeSignals(doc: ProseMirrorNode): SEOSignal[] {
  const signals: SEOSignal[] = [];
  let hasH1 = false;
  let lastHeadingLevel = 0;

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level as number;

      if (level === 1) {
        hasH1 = true;
        const text = node.textContent;
        if (text.length < 10 || text.length > 70) {
          signals.push({
            type: 'weak-title',
            severity: 'info',
            element: { from: pos, to: pos + node.nodeSize },
            message:
              text.length < 10
                ? 'Title may be too short (under 10 characters)'
                : 'Title may be too long (over 70 characters)',
          });
        }
      }

      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        signals.push({
          type: 'heading-hierarchy',
          severity: 'warning',
          element: { from: pos, to: pos + node.nodeSize },
          message: `Heading H${level} follows H${lastHeadingLevel}, skipping H${lastHeadingLevel + 1}`,
        });
      }

      lastHeadingLevel = level;
    }

    if (node.type.name === 'image') {
      const alt = node.attrs.alt as string | undefined;
      if (!alt || alt.trim() === '') {
        signals.push({
          type: 'empty-alt',
          severity: 'warning',
          element: { from: pos, to: pos + node.nodeSize },
          message: 'Image is missing alt text',
        });
      }
    }
  });

  const docHasContent = doc.textContent.trim().length > 0;
  if (!hasH1 && docHasContent) {
    signals.push({
      type: 'missing-h1',
      severity: 'warning',
      message: 'Document is missing an H1 heading',
    });
  }

  return signals;
}

export const SEOSignalsExtension = Extension.create<SEOSignalsOptions>({
  name: 'seoSignals',

  addOptions() {
    return {
      enabled: true,
      onSignalsUpdate: undefined,
    };
  },

  addStorage() {
    return {
      signals: [] as SEOSignal[],
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];

    const extensionStorage = this.storage as { signals: SEOSignal[] };
    const opts = this.options;

    return [
      new Plugin({
        key: seoSignalsPluginKey,
        state: {
          init(_, state) {
            const signals = computeSignals(state.doc);
            extensionStorage.signals = signals;
            return signals;
          },
          apply(tr, oldSignals, _oldState, newState) {
            if (!tr.docChanged) return oldSignals;
            const signals = computeSignals(newState.doc);
            extensionStorage.signals = signals;
            opts.onSignalsUpdate?.(signals);
            return signals;
          },
        },
        props: {
          decorations(state) {
            const signals = seoSignalsPluginKey.getState(state) as SEOSignal[] | undefined;
            if (!signals?.length) return DecorationSet.empty;

            const decorations: Decoration[] = [];
            for (const signal of signals) {
              if (!signal.element) continue;
              const { from, to } = signal.element;
              if (from >= 0 && to <= state.doc.content.size && from < to) {
                const className =
                  signal.type === 'heading-hierarchy'
                    ? 'wf-seo-heading-hierarchy'
                    : signal.type === 'weak-title'
                      ? 'wf-seo-weak-title'
                      : signal.type === 'empty-alt'
                        ? 'wf-seo-empty-alt'
                        : '';
                if (className) {
                  decorations.push(Decoration.node(from, to, { class: className }));
                }
              }
            }

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export { computeSignals };
