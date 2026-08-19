import type { AIConfig, AIProvider, AIProviderAdapter } from '@inkpilot/types';
import { InkpilotError, readProcessEnv } from '@inkpilot/utils';
import { createOpenAIAdapter } from './providers/openai';
import { createAnthropicAdapter } from './providers/anthropic';

export function createAIProvider(config: AIConfig): AIProviderAdapter {
  switch (config.provider) {
    case 'openai':
      return createOpenAIAdapter(config);
    case 'anthropic':
      return createAnthropicAdapter(config);
    default:
      throw new InkpilotError(
        `Unknown AI provider: ${config.provider as string}`,
        'UNKNOWN_AI_PROVIDER',
      );
  }
}

function nonEmpty(val: string | undefined): string | undefined {
  return val?.trim() || undefined;
}

/** Server-only names — never use NEXT_PUBLIC_* for API keys (they ship to the browser). */
const OPENAI_ENV_KEYS = ['OPENAI_API_KEY', 'SECRET_OPENAI_KEY', 'OPENAI_KEY'] as const;
const ANTHROPIC_ENV_KEYS = ['ANTHROPIC_API_KEY', 'SECRET_ANTHROPIC_KEY', 'ANTHROPIC_KEY'] as const;

/**
 * Build an AIConfig from environment variables.
 * Checks server-only env var names (e.g. `SECRET_OPENAI_KEY`, `OPENAI_API_KEY`).
 * Never reads `NEXT_PUBLIC_*` keys — those are exposed to the browser in Next.js.
 * Picks whichever provider has a key available (prefers OpenAI if both exist).
 * Returns undefined if no API key is found.
 * Any explicit overrides take precedence over env vars.
 */
export function resolveAIFromEnv(
  overrides: Partial<AIConfig> = {},
): AIConfig | undefined {
  const openaiKey = overrides.provider === 'openai' && overrides.apiKey
    ? overrides.apiKey
    : OPENAI_ENV_KEYS.reduce<string | undefined>((found, k) => found ?? nonEmpty(readProcessEnv(k)), undefined);

  const anthropicKey = overrides.provider === 'anthropic' && overrides.apiKey
    ? overrides.apiKey
    : ANTHROPIC_ENV_KEYS.reduce<string | undefined>((found, k) => found ?? nonEmpty(readProcessEnv(k)), undefined);

  let provider: AIProvider | undefined = overrides.provider;
  let apiKey: string | undefined = overrides.apiKey;

  if (!provider) {
    if (openaiKey) {
      provider = 'openai';
      apiKey = apiKey ?? openaiKey;
    } else if (anthropicKey) {
      provider = 'anthropic';
      apiKey = apiKey ?? anthropicKey;
    }
  }

  if (!apiKey) {
    apiKey = provider === 'openai' ? openaiKey : anthropicKey;
  }

  if (!provider || !apiKey) return undefined;

  return {
    provider,
    apiKey,
    model: overrides.model,
    baseURL: overrides.baseURL,
    defaultTone: overrides.defaultTone ?? 'casual',
    defaultIntent: overrides.defaultIntent ?? 'clarify',
    preserveMeaning: overrides.preserveMeaning ?? true,
    onRewrite: overrides.onRewrite,
  };
}
