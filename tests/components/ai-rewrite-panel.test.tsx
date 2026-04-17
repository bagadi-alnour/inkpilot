import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIRewritePanel } from '../../src/react/components/ai-rewrite-panel';
import { I18nContext, createI18nValue } from '../../src/i18n/context';

function renderWithI18n(ui: ReactElement) {
  return render(
    <I18nContext.Provider value={createI18nValue('en')}>{ui}</I18nContext.Provider>,
  );
}

describe('AIRewritePanel', () => {
  it('returns null when not rewriting and no result', () => {
    const { container } = renderWithI18n(
      <AIRewritePanel
        isRewriting={false}
        diff={[]}
        result={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows spinner when rewriting with empty diff', () => {
    renderWithI18n(
      <AIRewritePanel
        isRewriting
        diff={[]}
        result={null}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(document.querySelector('.wf-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Rewriting/)).toBeInTheDocument();
  });

  it('renders DiffView when diff segments present', () => {
    renderWithI18n(
      <AIRewritePanel
        isRewriting={false}
        diff={[
          { type: 'equal', text: 'a' },
          { type: 'insert', text: 'b' },
        ]}
        result={{
          original: 'a',
          rewritten: 'ab',
          tone: 'casual',
          intent: 'clarify',
          accepted: false,
        }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Added text')).toHaveTextContent('b');
  });

  it('Accept and Reject buttons invoke callbacks', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    renderWithI18n(
      <AIRewritePanel
        isRewriting={false}
        diff={[{ type: 'equal', text: 'ok' }]}
        result={{
          original: 'ok',
          rewritten: 'ok',
          tone: 'casual',
          intent: 'clarify',
          accepted: false,
        }}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Accept/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('Enter key triggers accept', () => {
    const onAccept = vi.fn();
    renderWithI18n(
      <AIRewritePanel
        isRewriting={false}
        diff={[{ type: 'equal', text: 'x' }]}
        result={{
          original: 'x',
          rewritten: 'x',
          tone: 'casual',
          intent: 'clarify',
          accepted: false,
        }}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    fireEvent.keyDown(document, { key: 'Enter', shiftKey: false });
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('Escape key triggers reject', () => {
    const onReject = vi.fn();
    renderWithI18n(
      <AIRewritePanel
        isRewriting={false}
        diff={[{ type: 'equal', text: 'x' }]}
        result={{
          original: 'x',
          rewritten: 'x',
          tone: 'casual',
          intent: 'clarify',
          accepted: false,
        }}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onReject).toHaveBeenCalledTimes(1);
  });
});
