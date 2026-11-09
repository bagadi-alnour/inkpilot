import { Extension } from '@tiptap/core';

export interface KeyboardShortcutsOptions {
  onRewrite?: () => void;
  onPublish?: () => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inkpilotShortcuts: {
      /** Run the publish action: open the publish panel, or call `onPublish` when the panel is off. */
      requestPublish: () => ReturnType;
    };
  }
}

export const KeyboardShortcutsExtension = Extension.create<KeyboardShortcutsOptions>({
  name: 'inkpilotKeyboardShortcuts',

  addOptions() {
    return {
      onRewrite: undefined,
      onPublish: undefined,
    };
  },

  addCommands() {
    return {
      requestPublish:
        () =>
        ({ dispatch }) => {
          if (!this.options.onPublish) return false;
          if (dispatch) this.options.onPublish();
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Mod-Shift-R / P are browser reload and private window; Alt avoids both.
      'Mod-Alt-r': () => {
        this.options.onRewrite?.();
        return true;
      },
      'Mod-Alt-p': () => this.editor.commands.requestPublish(),
    };
  },
});
