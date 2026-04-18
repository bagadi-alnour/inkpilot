import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface AIRewriteState {
  active: boolean;
  from: number;
  to: number;
  originalText: string;
}

export const aiRewritePluginKey = new PluginKey('aiRewrite');

export interface AIRewriteExtensionOptions {
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiRewrite: {
      setAIRewriteState: (state: AIRewriteState) => ReturnType;
      clearAIRewriteState: () => ReturnType;
    };
  }
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

  addCommands() {
    const storage = this.storage as { rewriteState: AIRewriteState | null };
    return {
      setAIRewriteState:
        (rewriteState: AIRewriteState) =>
        ({ editor }) => {
          storage.rewriteState = rewriteState;
          editor.view.dispatch(editor.state.tr.setMeta(aiRewritePluginKey, rewriteState));
          return true;
        },
      clearAIRewriteState:
        () =>
        ({ editor }) => {
          storage.rewriteState = null;
          editor.view.dispatch(editor.state.tr.setMeta(aiRewritePluginKey, null));
          return true;
        },
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
