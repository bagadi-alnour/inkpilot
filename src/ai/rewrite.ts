import type { Editor } from '@tiptap/core';
import type { AIConfig, AIProviderAdapter, AITone, AIIntent, RewriteResult, DiffSegment } from '@inkpilot/types';
import { getSurroundingContext, getSelectedText } from './context';
import { computeDiff } from './diff';
import { createStreamController } from './stream';
import type { StreamController } from './stream';

export interface RewriteSession {
  original: string;
  from: number;
  to: number;
  tone: AITone;
  intent: AIIntent;
  preserveMeaning: boolean;
  controller: StreamController;
  onStream: (accumulated: string, diff: DiffSegment[]) => void;
  onComplete: (result: RewriteResult) => void;
  onError: (error: Error) => void;
}

export async function executeRewrite(
  editor: Editor,
  aiProvider: AIProviderAdapter,
  session: RewriteSession,
): Promise<void> {
  const { from, to, tone, intent, preserveMeaning, controller } = session;
  const context = getSurroundingContext(editor, from, to);

  try {
    const stream = aiProvider.rewrite({
      selectedText: session.original,
      surroundingBefore: context.before,
      surroundingAfter: context.after,
      tone,
      intent,
      preserveMeaning,
      signal: controller.signal,
    });

    let accumulated = '';
    for await (const chunk of stream) {
      if (controller.isAborted()) break;
      accumulated += chunk;
      const diff = computeDiff(session.original, accumulated);
      session.onStream(accumulated, diff);
    }

    if (!controller.isAborted()) {
      const result: RewriteResult = {
        original: session.original,
        rewritten: accumulated,
        tone,
        intent,
        accepted: false,
      };
      session.onComplete(result);
    }
  } catch (error) {
    if (!controller.isAborted()) {
      session.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export function createRewriteSession(
  editor: Editor,
  overrides: Partial<Pick<RewriteSession, 'tone' | 'intent' | 'preserveMeaning'>> & {
    onStream: RewriteSession['onStream'];
    onComplete: RewriteSession['onComplete'];
    onError: RewriteSession['onError'];
  },
  config: AIConfig,
): RewriteSession | null {
  const { from, to } = editor.state.selection;
  if (from === to) return null;

  const original = getSelectedText(editor);
  if (!original.trim()) return null;

  return {
    original,
    from,
    to,
    tone: overrides.tone ?? config.defaultTone ?? 'casual',
    intent: overrides.intent ?? config.defaultIntent ?? 'clarify',
    preserveMeaning: overrides.preserveMeaning ?? config.preserveMeaning ?? true,
    controller: createStreamController(),
    onStream: overrides.onStream,
    onComplete: overrides.onComplete,
    onError: overrides.onError,
  };
}
