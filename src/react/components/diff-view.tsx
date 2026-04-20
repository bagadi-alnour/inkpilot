import type { DiffSegment } from '@inkpilot/types';

interface DiffViewProps {
  segments: DiffSegment[];
}

export function DiffView({ segments }: DiffViewProps) {
  if (segments.length === 0) return null;

  return (
    <div className="wf-ai-panel-content" aria-live="polite">
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'delete':
            return (
              <span key={i} className="wf-diff-delete" aria-label="Removed text">
                {segment.text}
              </span>
            );
          case 'insert':
            return (
              <span key={i} className="wf-diff-insert" aria-label="Added text">
                {segment.text}
              </span>
            );
          case 'equal':
          default:
            return <span key={i}>{segment.text}</span>;
        }
      })}
    </div>
  );
}
