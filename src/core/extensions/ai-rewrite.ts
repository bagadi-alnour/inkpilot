import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AIRewriteState {
  active: boolean;
  from: number;
  to: number;
  originalText: string;
}

const aiRewritePluginKey = new PluginKey('aiRewrite');

export interface AIRewriteExtensionOptions {
  enabled: boolean;
}

export const AIRewriteExtension = Extension.create<AIRewriteExtensionOptions>({
  name: 'aiRewrite',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addStorage() {
    return {
      rewriteState: null as AIRewriteState | null,
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];

    const extensionStorage = this.storage as { rewriteState: AIRewriteState | null };

    return [
      new Plugin({
        key: aiRewritePluginKey,
        props: {
          decorations(state) {
            const rewriteState = extensionStorage.rewriteState;
            if (!rewriteState?.active) return DecorationSet.empty;

            const { from, to } = rewriteState;
            if (from >= to || from < 0 || to > state.doc.content.size) {
              return DecorationSet.empty;
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(from, to, {
                class: 'wf-ai-rewrite-selection',
              }),
            ]);
          },
        },
      }),
    ];
  },
});
