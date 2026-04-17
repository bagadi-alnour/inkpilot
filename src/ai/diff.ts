import DiffMatchPatch from 'diff-match-patch';
import type { DiffSegment } from '@writeflow/types';

const dmp = new DiffMatchPatch();

export function computeDiff(original: string, rewritten: string): DiffSegment[] {
  const diffs = dmp.diff_main(original, rewritten);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([operation, text]) => ({
    type: operation === 0 ? 'equal' : operation === 1 ? 'insert' : 'delete',
    text,
  }));
}

export function hasMeaningfulDiff(segments: DiffSegment[]): boolean {
  return segments.some((s) => s.type !== 'equal');
}

export function getDiffStats(segments: DiffSegment[]): {
  insertions: number;
  deletions: number;
  unchanged: number;
} {
  let insertions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const segment of segments) {
    switch (segment.type) {
      case 'insert':
        insertions += segment.text.length;
        break;
      case 'delete':
        deletions += segment.text.length;
        break;
      case 'equal':
        unchanged += segment.text.length;
        break;
    }
  }

  return { insertions, deletions, unchanged };
}
