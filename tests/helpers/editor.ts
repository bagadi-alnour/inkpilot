import { Editor } from '@tiptap/core';
import type { Extensions } from '@tiptap/core';
import { createInkpilotKit } from '../../src/core/extensions/inkpilot-kit';
import { RewriteSessionExtension } from '../../src/core/extensions/rewrite-session';
import { SEOReportExtension } from '../../src/core/extensions/seo-report';
import type { InkpilotTransport } from '../../src/ai/transport';
import type { StreamEvent, StreamRequest } from '../../src/protocol';
import type { RewriteResult } from '../../src/types/ai';

export const LONG_PARAGRAPH =
  'We started by measuring where the time actually went, and it turned out that type checking, which ran inside next build and again in a separate CI job because nobody had removed the old step after the migration, accounted for almost forty percent of the total, while image optimization during the build accounted for most of the rest.';

export const SHORT_PARAGRAPH = 'The fix was two lines in the workflow file.';

export interface StreamCall {
  request: StreamRequest;
  signal: AbortSignal;
  push(event: StreamEvent): void;
  /** Close the stream without a terminal event. */
  end(): void;
}

/** A transport whose streams the test drives event by event. */
export function controlledTransport() {
  const calls: StreamCall[] = [];
  const transport: InkpilotTransport = {
    json: async () => ({ ok: false, code: 'network', message: 'Not used in these tests.' }),
    stream(request, signal) {
      const queue: StreamEvent[] = [];
      let ended = false;
      let wake: (() => void) | null = null;
      calls.push({
        request,
        signal,
        push(event) {
          queue.push(event);
          wake?.();
        },
        end() {
          ended = true;
          wake?.();
        },
      });
      return (async function* () {
        for (;;) {
          const next = queue.shift();
          if (next) {
            yield next;
            continue;
          }
          if (ended || signal.aborted) return;
          await new Promise<void>((resolve) => {
            wake = resolve;
            signal.addEventListener('abort', () => resolve(), { once: true });
          });
          wake = null;
        }
      })();
    },
  };
  return { transport, calls };
}

/** Let queued microtasks and stream iterations run. */
export async function flush(times = 5) {
  for (let i = 0; i < times; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

export function createTestEditor(
  content: string,
  transport?: InkpilotTransport,
  extra: Extensions = [],
  onSettle: (result: RewriteResult) => void = () => undefined,
) {
  return new Editor({
    element: document.createElement('div'),
    extensions: [
      ...createInkpilotKit(),
      RewriteSessionExtension.configure({ getTransport: () => transport, onSettle }),
      SEOReportExtension.configure({ debounceMs: 0 }),
      ...extra,
    ],
    content,
  });
}

/** Position range of the first paragraph whose text includes `needle`. */
export function paragraphRange(editor: Editor, needle: string): { from: number; to: number } {
  let range: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (range) return false;
    if (node.type.name === 'paragraph' && node.textContent.includes(needle)) {
      range = { from: pos + 1, to: pos + node.nodeSize - 1 };
    }
    return true;
  });
  if (!range) throw new Error(`No paragraph containing "${needle}"`);
  return range;
}
