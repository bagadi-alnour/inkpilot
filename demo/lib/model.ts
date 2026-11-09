import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { simulateReadableStream } from 'ai';
import type { LanguageModel } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { ARTICLE, DEMO_LANGS, SUGGESTIONS } from './content';
import type { DemoLang } from './content';

/** The real provider when a server-side key is set, otherwise the scripted model. */
export function getModel(): LanguageModel {
  if (process.env.ANTHROPIC_API_KEY) return anthropic(process.env.INKPILOT_MODEL ?? 'claude-sonnet-5-5');
  if (process.env.OPENAI_API_KEY) return openai(process.env.INKPILOT_MODEL ?? 'gpt-5-mini');
  return scriptedModel;
}

/** Provider name for the page, or null for the scripted model. */
export function realProvider(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return 'Anthropic';
  if (process.env.OPENAI_API_KEY) return 'OpenAI';
  return null;
}

const USAGE = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

const isArabic = (text: string) => /[؀-ۿ]/.test(text);

/**
 * The canned fix for the seeded sentence; for anything else, split sentences at a
 * comma before a joining word. Enough to show the flow on text the visitor types.
 */
function scriptedRewrite(html: string): string {
  const seeded = DEMO_LANGS.find((lang) => html.includes(ARTICLE[lang].long));
  if (seeded) return `<p>${ARTICLE[seeded].fixed}</p>`;
  return html
    .replace(/,\s+(and|while|which|because)\s+(\w)/gi, (_match, _joiner: string, first: string) => `. ${first.toUpperCase()}`)
    .replace(/،\s*(بينما|لأن)\s*/g, '. ');
}

/** The prompt as plain text, with JSON escapes undone so content can be matched. */
function promptText(prompt: unknown): string {
  return JSON.stringify(prompt).replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

const scriptedModel = new MockLanguageModelV4({
  provider: 'inkpilot-demo',
  modelId: 'scripted',
  doGenerate: ({ prompt }) => {
    const text = promptText(prompt);
    const lang: DemoLang = isArabic(text) ? 'ar' : 'en';
    const canned = SUGGESTIONS[lang];
    const body = text.includes('Write alt text')
      ? { alt: canned.alt }
      : text.includes('Suggest 3 titles')
        ? { titles: canned.titles }
        : { descriptions: canned.descriptions };
    return Promise.resolve({
      content: [{ type: 'text' as const, text: JSON.stringify(body) }],
      finishReason: { unified: 'stop' as const, raw: 'stop' },
      usage: USAGE,
      warnings: [],
    });
  },
  doStream: ({ prompt }) => {
    const content = /<<<CONTENT\n([\s\S]*?)\nCONTENT>>>/.exec(promptText(prompt))?.[1] ?? '<p></p>';
    const deltas = scriptedRewrite(content).match(/[\s\S]{1,12}/g) ?? [];
    return Promise.resolve({
      stream: simulateReadableStream({
        chunkDelayInMs: 30,
        chunks: [
          { type: 'stream-start' as const, warnings: [] },
          { type: 'text-start' as const, id: 'demo' },
          ...deltas.map((delta) => ({ type: 'text-delta' as const, id: 'demo', delta })),
          { type: 'text-end' as const, id: 'demo' },
          { type: 'finish' as const, finishReason: { unified: 'stop' as const, raw: 'stop' }, usage: USAGE },
        ],
      }),
    });
  },
});
