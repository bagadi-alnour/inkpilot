import type { AIConfig, AIProviderAdapter } from '@inkpilot/types';
import { InkpilotError } from '@inkpilot/utils';
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
