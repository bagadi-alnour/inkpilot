import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { simulateReadableStream } from 'ai';
import type { LanguageModel } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

/**
 * Pick the model for the Inkpilot route from server-only env vars.
 * Without a key the demo uses a scripted local model so the editor still works.
 */
export function getModel(): LanguageModel {
  if (process.env.ANTHROPIC_API_KEY) return anthropic(process.env.INKPILOT_MODEL ?? 'claude-sonnet-5-5');
  if (process.env.OPENAI_API_KEY) return openai(process.env.INKPILOT_MODEL ?? 'gpt-5-mini');
  return demoModel;
}

/** Human-readable name of the model `getModel` picks, for the demo page. */
export function describeModel(): string {
  if (process.env.ANTHROPIC_API_KEY) return 'Anthropic';
  if (process.env.OPENAI_API_KEY) return 'OpenAI';
  return 'a scripted demo model (set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local)';
}

const USAGE = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

/** Splits long sentences at ", and" / ", while" / ", which" — enough to demo the flow. */
function demoRewrite(html: string): string {
  return html.replace(/,\s+(and|while|which|because)\s+(\w)/gi, (_m, _joiner: string, first: string) => `. ${first.toUpperCase()}`);
}

const demoModel = new MockLanguageModelV4({
  provider: 'inkpilot-demo',
  modelId: 'sentence-splitter',
  // Title, description and alt suggestions: canned, but shaped like the real thing.
  doGenerate: async ({ prompt }) => {
    const text = JSON.stringify(prompt);
    const body = text.includes('Write alt text')
      ? { alt: 'Chart from the article (demo description)' }
      : text.includes('Suggest 3 titles')
        ? { titles: ['How we halved our build time', 'Two CI steps we removed', 'Faster builds without new tools'] }
        : { descriptions: ['We found two duplicated steps in our CI pipeline and removed them, which cut our build time from 9 minutes to 4.'] };
    return {
      content: [{ type: 'text', text: JSON.stringify(body) }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: USAGE,
      warnings: [],
    };
  },
  doStream: async ({ prompt }) => {
    const text = JSON.stringify(prompt);
    const content = /<<<CONTENT\\n([\s\S]*?)\\nCONTENT>>>/.exec(text)?.[1]?.replace(/\\"/g, '"') ?? '<p></p>';
    const output = demoRewrite(content);
    const deltas = output.match(/[\s\S]{1,12}/g) ?? [];
    return {
      stream: simulateReadableStream({
        chunkDelayInMs: 40,
        chunks: [
          { type: 'stream-start' as const, warnings: [] },
          { type: 'text-start' as const, id: 'demo' },
          ...deltas.map((delta) => ({ type: 'text-delta' as const, id: 'demo', delta })),
          { type: 'text-end' as const, id: 'demo' },
          { type: 'finish' as const, finishReason: { unified: 'stop' as const, raw: 'stop' }, usage: USAGE },
        ],
      }),
    };
  },
});
