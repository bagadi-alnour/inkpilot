import type { AIConfig, AIProvider } from '@inkpilot/editor';

export type AIAvailability = {
  openai: boolean;
  anthropic: boolean;
  hasAnyKey: boolean;
  defaultProvider: AIProvider;
};

function readValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveAIAvailability(env: NodeJS.ProcessEnv = process.env): AIAvailability {
  const openai = Boolean(
    readValue(env.OPENAI_API_KEY) ?? readValue(env.SECRET_OPENAI_KEY) ?? readValue(env.OPENAI_KEY),
  );
  const anthropic = Boolean(
    readValue(env.ANTHROPIC_API_KEY) ??
      readValue(env.SECRET_ANTHROPIC_KEY) ??
      readValue(env.ANTHROPIC_KEY),
  );

  let defaultProvider: AIProvider;
  if (openai) {
    defaultProvider = 'openai';
  } else if (anthropic) {
    defaultProvider = 'anthropic';
  } else {
    defaultProvider = 'openai';
  }

  return {
    openai,
    anthropic,
    hasAnyKey: openai || anthropic,
    defaultProvider,
  };
}

export function createProxyAIConfig(provider: AIProvider): AIConfig {
  return {
    provider,
    apiKey: 'server-proxy',
    baseURL: `/api/ai/${provider}`,
    defaultTone: 'casual',
    defaultIntent: 'clarify',
    preserveMeaning: true,
  };
}
