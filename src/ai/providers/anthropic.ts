import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { AIConfig, AIProviderAdapter, RewriteParams, RestructureParams } from '@writeflow/types';
import { buildRewritePrompt, buildRestructurePrompt, buildTitleSuggestionPrompt, buildMetaSuggestionPrompt } from '../prompts';

export function createAnthropicAdapter(config: AIConfig): AIProviderAdapter {
  const anthropic = createAnthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const model = anthropic(config.model ?? 'claude-sonnet-4-20250514');

  return {
    async *rewrite(params: RewriteParams): AsyncIterable<string> {
      const prompt = buildRewritePrompt(params);

      const result = streamText({
        model,
        prompt,
        maxTokens: 2000,
        temperature: 0.7,
        abortSignal: params.signal,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    },

    async *restructure(params: RestructureParams): AsyncIterable<string> {
      const prompt = buildRestructurePrompt({
        fullContent: params.fullContent,
        headings: params.headingStructure.map((h) => `${'#'.repeat(h.level)} ${h.text}`),
        instructions: params.instructions,
      });

      const result = streamText({
        model,
        prompt,
        maxTokens: 4000,
        temperature: 0.7,
        abortSignal: params.signal,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    },

    async suggestTitle(content: string): Promise<string[]> {
      const prompt = buildTitleSuggestionPrompt(content);

      const result = streamText({
        model,
        prompt,
        maxTokens: 200,
        temperature: 0.8,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);
    },

    async suggestMeta(content: string): Promise<string> {
      const prompt = buildMetaSuggestionPrompt(content);

      const result = streamText({
        model,
        prompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      return text.trim();
    },
  };
}
