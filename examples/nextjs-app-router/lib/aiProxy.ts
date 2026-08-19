import type { AIProvider } from '@inkpilot/editor';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'cookie',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-api-key',
  'authorization',
]);

const PROVIDER_CONFIG: Record<
  AIProvider,
  {
    /** Tried in order; first non-empty value wins (all server-only). */
    envKeys: readonly string[];
    upstreamBaseUrl: string;
    applyAuth: (headers: Headers, apiKey: string) => void;
  }
> = {
  openai: {
    envKeys: ['OPENAI_API_KEY', 'SECRET_OPENAI_KEY', 'OPENAI_KEY'],
    upstreamBaseUrl: 'https://api.openai.com/v1',
    applyAuth: (headers, apiKey) => {
      headers.set('authorization', `Bearer ${apiKey}`);
    },
  },
  anthropic: {
    envKeys: ['ANTHROPIC_API_KEY', 'SECRET_ANTHROPIC_KEY', 'ANTHROPIC_KEY'],
    upstreamBaseUrl: 'https://api.anthropic.com/v1',
    applyAuth: (headers, apiKey) => {
      headers.set('x-api-key', apiKey);
    },
  },
};

function readValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isAIProvider(value: string | undefined): value is AIProvider {
  return value === 'openai' || value === 'anthropic';
}

export function getProviderApiKey(
  provider: AIProvider,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  for (const key of PROVIDER_CONFIG[provider].envKeys) {
    const v = readValue(env[key]);
    if (v) return v;
  }
  return undefined;
}

export function getMissingProviderKeyMessage(provider: AIProvider): string {
  const keys = PROVIDER_CONFIG[provider].envKeys.join(' or ');
  return `${keys} is not configured on the server`;
}

export function buildUpstreamUrl(
  provider: AIProvider,
  pathSegments: string[],
  search: string,
): string {
  const path = pathSegments.map(encodeURIComponent).join('/');
  const pathname = path.length > 0 ? `/${path}` : '';
  return `${PROVIDER_CONFIG[provider].upstreamBaseUrl}${pathname}${search}`;
}

export function createProxyHeaders(source: Headers, provider: AIProvider, apiKey: string): Headers {
  const headers = new Headers(source);

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  PROVIDER_CONFIG[provider].applyAuth(headers, apiKey);

  return headers;
}

export function filterResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  source.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}
