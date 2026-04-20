import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SEOSignalIndicators } from '../../src/react/components/seo-signals';
import { I18nContext, createI18nValue } from '../../src/i18n/context';
import type { SEOSignal } from '@inkpilot/types';

function renderWithI18n(ui: ReactElement) {
  return render(
    <I18nContext.Provider value={createI18nValue('en')}>{ui}</I18nContext.Provider>,
  );
}

describe('SEOSignalIndicators', () => {
  it('renders nothing when signals array is empty', () => {
    const { container } = renderWithI18n(<SEOSignalIndicators signals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a banner when missing-h1 is present', () => {
    const signals: SEOSignal[] = [
      {
        type: 'missing-h1',
        severity: 'warning',
        message: 'Document is missing an H1 heading',
      },
    ];
    renderWithI18n(<SEOSignalIndicators signals={signals} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Missing H1 heading/)).toBeInTheDocument();
  });

  it('does not render when signals exist but missing-h1 is absent', () => {
    const signals: SEOSignal[] = [
      {
        type: 'weak-title',
        severity: 'info',
        message: 'Title tip',
        element: { from: 0, to: 1 },
      },
    ];
    const { container } = renderWithI18n(<SEOSignalIndicators signals={signals} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows one banner when missing-h1 is present alongside other signals', () => {
    const signals: SEOSignal[] = [
      {
        type: 'weak-title',
        severity: 'info',
        message: 'Title tip',
        element: { from: 0, to: 1 },
      },
      {
        type: 'missing-h1',
        severity: 'warning',
        message: 'Document is missing an H1 heading',
      },
    ];
    renderWithI18n(<SEOSignalIndicators signals={signals} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText(/Missing H1 heading/)).toBeInTheDocument();
  });

  it('uses warning styling for the missing-h1 banner', () => {
    const signals: SEOSignal[] = [
      {
        type: 'missing-h1',
        severity: 'warning',
        message: 'Document is missing an H1 heading',
      },
    ];
    renderWithI18n(<SEOSignalIndicators signals={signals} />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('wf-seo-signal-banner');
    expect(banner).toHaveStyle({
      color: 'var(--wf-color-warning, #d97706)',
    });
  });
});
