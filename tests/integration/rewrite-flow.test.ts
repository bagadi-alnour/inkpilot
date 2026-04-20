import { describe, it, expect, vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import { createAIProvider, createRewriteSession } from '@inkpilot/ai';

describe('rewrite flow integration', () => {
  it('creates an AI provider from config', () => {
    const provider = createAIProvider({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      defaultTone: 'formal',
      defaultIntent: 'simplify',
    });

    expect(provider).toBeDefined();
    expect(typeof provider.rewrite).toBe('function');
  });

  it('createRewriteSession creates a session with correct params', () => {
    const mockEditor = {
      state: {
        selection: { from: 1, to: 6 },
        doc: {
          textBetween: (from: number, to: number) => 'hello',
        },
      },
    } as unknown as Editor;

    const onStream = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const session = createRewriteSession(
      mockEditor,
      {
        tone: 'formal',
        intent: 'expand',
        preserveMeaning: false,
        onStream,
        onComplete,
        onError,
      },
      {
        defaultTone: 'casual',
        defaultIntent: 'clarify',
        preserveMeaning: true,
      },
    );

    expect(session).not.toBeNull();
    expect(session!.original).toBe('hello');
    expect(session!.from).toBe(1);
    expect(session!.to).toBe(6);
    expect(session!.tone).toBe('formal');
    expect(session!.intent).toBe('expand');
    expect(session!.preserveMeaning).toBe(false);
    expect(session!.onStream).toBe(onStream);
    expect(session!.onComplete).toBe(onComplete);
    expect(session!.onError).toBe(onError);
  });

  it('returns null when selection is empty', () => {
    const mockEditor = {
      state: {
        selection: { from: 2, to: 2 },
        doc: { textBetween: () => '' },
      },
    } as unknown as Editor;

    expect(
      createRewriteSession(
        mockEditor,
        {
          onStream: vi.fn(),
          onComplete: vi.fn(),
          onError: vi.fn(),
        },
        { provider: 'openai', apiKey: 'k' },
      ),
    ).toBeNull();
  });

  it('abort controller marks session as aborted', () => {
    const mockEditor = {
      state: {
        selection: { from: 0, to: 4 },
        doc: {
          textBetween: () => 'word',
        },
      },
    } as unknown as Editor;

    const session = createRewriteSession(
      mockEditor,
      {
        onStream: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      },
      { provider: 'openai', apiKey: 'k' },
    );

    expect(session).not.toBeNull();
    expect(session!.controller.isAborted()).toBe(false);
    session!.controller.abort();
    expect(session!.controller.isAborted()).toBe(true);
  });
});
