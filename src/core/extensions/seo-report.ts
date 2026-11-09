import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { analyzeDocument, computeScore, DEFAULT_RULE_OPTIONS } from '../../seo/engine';
import { isFixableIssueCode } from '../../protocol';
import type { AnalyzeContext, Issue, Report } from '../../seo/engine';
import { getRewriteSession } from './rewrite-session';

/**
 * Live SEO report: the pure engine re-runs after typing pauses, issue ranges follow
 * edits in between, and each ranged issue gets a severity underline.
 * AI never runs here; fixes start only from an explicit `fixIssue`.
 */

export interface SEOReportState {
  report: Report;
  ignored: ReadonlySet<string>;
  /** The document changed since `report` was computed. */
  stale: boolean;
}

type SEOReportMeta = { type: 'report'; report: Report } | { type: 'ignore'; id: string };

export interface SEOReportOptions {
  enabled: boolean;
  debounceMs: number;
  getContext: () => AnalyzeContext;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    seoReport: {
      /** Re-run the analysis now (e.g. after keywords or locale change). */
      refreshReport: () => ReturnType;
      ignoreIssue: (id: string) => ReturnType;
      /** Resolve an issue with AI: rewrite its range, or suggest alt text for its image. */
      fixIssue: (id: string) => ReturnType;
    };
  }
}

export const seoReportKey = new PluginKey<SEOReportState>('inkpilotSeoReport');

const EMPTY_REPORT: Report = { issues: [], score: 100 };

export function getSEOReport(state: EditorState): Report {
  return seoReportKey.getState(state)?.report ?? EMPTY_REPORT;
}

export function findIssue(state: EditorState, id: string): Issue | undefined {
  return getSEOReport(state).issues.find((issue) => issue.id === id);
}

export const SEOReportExtension = Extension.create<SEOReportOptions>({
  name: 'seoReport',

  addOptions() {
    return {
      enabled: true,
      debounceMs: 400,
      getContext: () => ({ locale: 'en', rules: DEFAULT_RULE_OPTIONS, keywords: [] }),
    };
  },

  addCommands() {
    const options = this.options;
    return {
      refreshReport:
        () =>
        ({ state, tr, dispatch }) => {
          const current = seoReportKey.getState(state);
          if (!current) return false;
          if (dispatch) {
            const report = analyzeDocument(tr.doc, options.getContext(), current.ignored);
            tr.setMeta(seoReportKey, { type: 'report', report } satisfies SEOReportMeta).setMeta('addToHistory', false);
          }
          return true;
        },

      ignoreIssue:
        (id) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(seoReportKey, { type: 'ignore', id } satisfies SEOReportMeta).setMeta('addToHistory', false);
          return true;
        },

      fixIssue:
        (id) =>
        ({ state, commands }) => {
          const issue = findIssue(state, id);
          if (issue?.fix === 'ai-alt' && issue.range) return commands.suggestAltText(issue.range.from);
          if (!issue?.range || issue.fix !== 'ai-rewrite' || !isFixableIssueCode(issue.code)) return false;
          return commands.startRewrite({
            from: issue.range.from,
            to: issue.range.to,
            source: { type: 'issue', issueId: issue.id, code: issue.code, params: issue.params },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];
    const options = this.options;

    return [
      new Plugin<SEOReportState>({
        key: seoReportKey,
        state: {
          init: (_config, state) => ({
            report: analyzeDocument(state.doc, options.getContext()),
            ignored: new Set(),
            stale: false,
          }),
          apply(tr, value) {
            const meta = tr.getMeta(seoReportKey) as SEOReportMeta | undefined;
            if (meta?.type === 'report') return { ...value, report: meta.report, stale: false };
            if (meta?.type === 'ignore') {
              const ignored = new Set(value.ignored).add(meta.id);
              const issues = value.report.issues.filter((issue) => issue.id !== meta.id);
              return { ...value, ignored, report: { issues, score: computeScore(issues) } };
            }
            if (!tr.docChanged) return value;

            // Keep underlines on the right text until the debounced re-run lands.
            const issues = value.report.issues.flatMap((issue): Issue[] => {
              if (!issue.range) return [issue];
              const from = tr.mapping.map(issue.range.from, 1);
              const to = tr.mapping.map(issue.range.to, -1);
              return from < to ? [{ ...issue, range: { from, to } }] : [];
            });
            return { ...value, report: { ...value.report, issues }, stale: true };
          },
        },
        view: (view) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          return {
            update() {
              const current = seoReportKey.getState(view.state);
              if (!current?.stale) return;
              clearTimeout(timer);
              timer = setTimeout(() => {
                const latest = seoReportKey.getState(view.state);
                if (!latest?.stale || view.isDestroyed) return;
                const report = analyzeDocument(view.state.doc, options.getContext(), latest.ignored);
                view.dispatch(
                  view.state.tr.setMeta(seoReportKey, { type: 'report', report } satisfies SEOReportMeta).setMeta('addToHistory', false),
                );
              }, options.debounceMs);
            },
            destroy() {
              clearTimeout(timer);
            },
          };
        },
        props: {
          decorations(state) {
            const report = getSEOReport(state);
            const session = getRewriteSession(state);
            const decorations: Decoration[] = [];
            for (const issue of report.issues) {
              if (!issue.range) continue;
              const { from, to } = issue.range;
              // The rewrite preview already marks this text.
              if (session && from < session.target.to && to > session.target.from) continue;
              decorations.push(
                Decoration.inline(from, to, { class: `ip-issue ip-issue--${issue.severity}`, 'data-ip-issue': issue.id }),
              );
            }
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
