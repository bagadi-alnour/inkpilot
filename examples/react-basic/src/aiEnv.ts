import type { AIProvider } from '@writeflow/editor';

type Env = ImportMetaEnv;

export type ResolvedAIEnv = {
  provider?: AIProvider;
  apiKey?: string;
  hasAnyKey: boolean;
};

function readKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveAIFromEnv(env: Env = import.meta.env): ResolvedAIEnv {
  const openaiKey = readKey(env.VITE_OPENAI_API_KEY) ?? readKey(env.VITE_OPENAI_KEY);
  const anthropicKey = readKey(env.VITE_ANTHROPIC_API_KEY) ?? readKey(env.VITE_ANTHROPIC_KEY);

  // Back-compat for the earlier single-key demo env var.
  const genericKey = readKey(env.VITE_AI_API_KEY);

  const hasAnyKey = Boolean(openaiKey || anthropicKey || genericKey);

  const explicitProvider = readKey(env.VITE_AI_PROVIDER) as AIProvider | undefined;
  if (explicitProvider === 'openai') {
    return { provider: 'openai', apiKey: openaiKey ?? genericKey, hasAnyKey };
  }
  if (explicitProvider === 'anthropic') {
    return { provider: 'anthropic', apiKey: anthropicKey ?? genericKey, hasAnyKey };
  }

  if (anthropicKey) return { provider: 'anthropic', apiKey: anthropicKey, hasAnyKey };
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey, hasAnyKey };

  return { provider: undefined, apiKey: genericKey, hasAnyKey };
}

