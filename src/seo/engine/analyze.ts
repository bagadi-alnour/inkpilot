import type { Node as PMNode } from '@tiptap/pm/model';
import type { AnalyzeContext, Issue, IssueCode, IssueSeverity, Report, Rule } from './types';
import { altTextRule, descriptionRule, structureRule, titleRule } from './rules/structure';
import { readabilityRule, readingEaseRule } from './rules/readability';
import { keywordRule } from './rules/keywords';

const RULES: readonly Rule[] = [structureRule, titleRule, descriptionRule, altTextRule, readabilityRule, readingEaseRule, keywordRule];

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = { error: 15, warning: 8, info: 3 };
/** One problem repeated many times shouldn't sink the score on its own. */
const MAX_PENALTY_PER_CODE = 24;

export function computeScore(issues: Issue[]): number {
  const penalties = new Map<IssueCode, number>();
  for (const issue of issues) {
    penalties.set(issue.code, (penalties.get(issue.code) ?? 0) + SEVERITY_WEIGHT[issue.severity]);
  }
  let total = 0;
  for (const penalty of penalties.values()) total += Math.min(penalty, MAX_PENALTY_PER_CODE);
  return Math.max(0, 100 - total);
}

/**
 * Run every rule against a document. Pure and synchronous: the live plugin calls it
 * debounced, and publishing calls it on the exact document being published.
 */
export function analyzeDocument(doc: PMNode, ctx: AnalyzeContext, ignored: ReadonlySet<string> = new Set()): Report {
  // Nothing written yet: nothing to review.
  if (!doc.textContent.trim() && doc.childCount <= 1 && !doc.firstChild?.childCount) return { issues: [], score: 100 };
  const issues = RULES.flatMap((rule) => rule(doc, ctx)).filter((issue) => !ignored.has(issue.id));
  return { issues, score: computeScore(issues) };
}
