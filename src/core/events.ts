import type { EditorEventMap, EditorEventName, EditorEventHandler, EditorEvents } from '@inkpilot/types';

export function createEventEmitter(): EditorEvents {
  const listeners: Partial<Record<EditorEventName, Set<(payload: unknown) => void>>> = {};

  return {
    on<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>) {
      const set = (listeners[event] ??= new Set());
      set.add(handler as (payload: unknown) => void);
    },

    off<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>) {
      listeners[event]?.delete(handler as (payload: unknown) => void);
    },

    emit<T extends EditorEventName>(event: T, payload: EditorEventMap[T]) {
      listeners[event]?.forEach((handler) => {
        (handler as (p: EditorEventMap[T]) => void)(payload);
      });
    },
  };
}
