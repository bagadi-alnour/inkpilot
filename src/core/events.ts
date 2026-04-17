import type { EditorEventMap, EditorEventName, EditorEventHandler, EditorEvents } from '@writeflow/types';

type ListenerMap = {
  [K in EditorEventName]?: Set<EditorEventHandler<K>>;
};

export function createEventEmitter(): EditorEvents {
  const listeners: ListenerMap = {};

  return {
    on<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>) {
      if (!listeners[event]) {
        listeners[event] = new Set() as ListenerMap[T];
      }
      (listeners[event] as Set<EditorEventHandler<T>>).add(handler);
    },

    off<T extends EditorEventName>(event: T, handler: EditorEventHandler<T>) {
      (listeners[event] as Set<EditorEventHandler<T>> | undefined)?.delete(handler);
    },

    emit<T extends EditorEventName>(event: T, payload: EditorEventMap[T]) {
      (listeners[event] as Set<EditorEventHandler<T>> | undefined)?.forEach((handler) => {
        handler(payload);
      });
    },
  };
}
