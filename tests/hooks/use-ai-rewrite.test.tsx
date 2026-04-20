import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIRewrite } from '../../src/react/hooks/use-ai-rewrite';

const {
  createAIProviderMock,
  createRewriteSessionMock,
  executeRewriteMock,
  latestSessionRef,
} = vi.hoisted(() => ({
  createAIProviderMock: vi.fn(),
  createRewriteSessionMock: vi.fn(),
  executeRewriteMock: vi.fn(),
  latestSessionRef: { current: null as Record<string, unknown> | null },
}));

vi.mock('@inkpilot/ai', () => ({
  createAIProvider: createAIProviderMock,
  createRewriteSession: createRewriteSessionMock,
  executeRewrite: executeRewriteMock,
}));

describe('useAIRewrite', () => {
  const run = vi.fn();
  const chainable = {
    focus: () => chainable,
    deleteRange: () => ({
      insertContentAt: () => ({ run }),
    }),
    insertContentAt: () => ({ run }),
    run,
  };

  const editor = {
    state: {
      selection: { from: 1, to: 6 },
      doc: { textBetween: () => 'hello' },
    },
    chain: () => chainable,
  } as const;

  beforeEach(() => {
    run.mockReset();
    createAIProviderMock.mockReset();
    createRewriteSessionMock.mockReset();
    executeRewriteMock.mockReset();

    createAIProviderMock.mockReturnValue({});
    createRewriteSessionMock.mockImplementation((_editor, overrides) => {
      const session = {
        original: 'hello',
        from: 1,
        to: 6,
        tone: 'casual',
        intent: 'clarify',
        preserveMeaning: true,
        controller: {
          abort: vi.fn(),
          isAborted: () => false,
          signal: new AbortController().signal,
        },
        ...overrides,
      };
      latestSessionRef.current = session;
      return session;
    });
  });

  it('fires onRewrite with accepted=true after accept and clears the preview state', async () => {
    const onRewrite = vi.fn();
    executeRewriteMock.mockImplementation(async (_editor, _provider, session) => {
      session.onComplete({
        original: 'hello',
        rewritten: 'hello world',
        tone: 'casual',
        intent: 'clarify',
        accepted: false,
      });
    });

    const { result } = renderHook(() =>
      useAIRewrite(editor as never, { provider: 'openai', apiKey: 'test', onRewrite }),
    );

    await act(async () => {
      result.current.rewrite();
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    act(() => {
      result.current.accept();
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(onRewrite).toHaveBeenCalledWith({
      original: 'hello',
      rewritten: 'hello world',
      tone: 'casual',
      intent: 'clarify',
      accepted: true,
    });
    expect(result.current.result).toBeNull();
    expect(result.current.diff).toEqual([]);
  });

  it('fires onRewrite with accepted=false when the rewrite is rejected', async () => {
    const onRewrite = vi.fn();
    executeRewriteMock.mockImplementation(async (_editor, _provider, session) => {
      session.onComplete({
        original: 'hello',
        rewritten: 'hello world',
        tone: 'casual',
        intent: 'clarify',
        accepted: false,
      });
    });

    const { result } = renderHook(() =>
      useAIRewrite(editor as never, { provider: 'openai', apiKey: 'test', onRewrite }),
    );

    await act(async () => {
      result.current.rewrite();
    });

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    act(() => {
      result.current.reject();
    });

    expect(run).not.toHaveBeenCalled();
    expect(onRewrite).toHaveBeenCalledWith({
      original: 'hello',
      rewritten: 'hello world',
      tone: 'casual',
      intent: 'clarify',
      accepted: false,
    });
    expect(result.current.result).toBeNull();
  });
});
