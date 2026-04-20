import type { AIProvider } from '@inkpilot/editor';

export type ResolvedAIEnv = {
  provider?: AIProvider;
  apiKey?: string;
  hasAnyKey: boolean;
};

function readKey(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Reads AI keys from Next.js public env (inlined at build time on the client).
 */
export function resolveAIFromEnv(): ResolvedAIEnv {
  const openaiKey = readKey(process.env.NEXT_PUBLIC_OPENAI_KEY);
  const anthropicKey = readKey(process.env.NEXT_PUBLIC_ANTHROPIC_KEY);

  const hasAnyKey = Boolean(openaiKey || anthropicKey);

  const explicit = readKey(process.env.NEXT_PUBLIC_AI_PROVIDER)?.toLowerCase();
  if (explicit === 'openai') {
    return { provider: 'openai', apiKey: openaiKey, hasAnyKey };
  }
  if (explicit === 'anthropic') {
    return { provider: 'anthropic', apiKey: anthropicKey, hasAnyKey };
  }

  if (anthropicKey) return { provider: 'anthropic', apiKey: anthropicKey, hasAnyKey };
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey, hasAnyKey };

  return { provider: undefined, apiKey: undefined, hasAnyKey };
}
