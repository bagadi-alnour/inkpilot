import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffView } from '../../src/react/components/diff-view';

describe('DiffView', () => {
  it('renders nothing when segments is empty', () => {
    const { container } = render(<DiffView segments={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders equal segments as plain text', () => {
    render(<DiffView segments={[{ type: 'equal', text: 'same text' }]} />);
    expect(screen.getByText('same text')).toBeInTheDocument();
    expect(screen.getByText('same text').className).toBe('');
  });

  it('renders delete segments with wf-diff-delete class', () => {
    render(<DiffView segments={[{ type: 'delete', text: 'removed' }]} />);
    const el = screen.getByLabelText('Removed text');
    expect(el).toHaveClass('wf-diff-delete');
    expect(el).toHaveTextContent('removed');
  });

  it('renders insert segments with wf-diff-insert class', () => {
    render(<DiffView segments={[{ type: 'insert', text: 'added' }]} />);
    const el = screen.getByLabelText('Added text');
    expect(el).toHaveClass('wf-diff-insert');
    expect(el).toHaveTextContent('added');
  });

  it('has aria-live="polite" on container', () => {
    const { container } = render(
      <DiffView segments={[{ type: 'equal', text: 'x' }]} />,
    );
    const wrapper = container.querySelector('.wf-ai-panel-content');
    expect(wrapper).toHaveAttribute('aria-live', 'polite');
  });
});
