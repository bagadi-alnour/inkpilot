// EXAMPLE ONLY — not production-ready.
//
// This handler forwards any request straight to OpenAI/Anthropic using the server's API key,
// with no authentication, authorisation, request validation, or rate limiting. Anyone who can
// reach it can spend your API budget. Before shipping something like this, add at minimum:
// caller authentication, a per-user rate limit, and an allowlist of upstream paths and models.

import { Readable } from 'node:stream';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  buildUpstreamUrl,
  createProxyHeaders,
  filterResponseHeaders,
  getMissingProviderKeyMessage,
  getProviderApiKey,
  isAIProvider,
} from '../../../../lib/aiProxy';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function hasRequestBody(method?: string): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

async function readRawBody(req: NextApiRequest): Promise<Buffer | undefined> {
  if (!hasRequestBody(req.method)) {
    return undefined;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    if (chunk instanceof Uint8Array) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerParam = Array.isArray(req.query.provider)
    ? req.query.provider[0]
    : req.query.provider;

  if (!isAIProvider(providerParam)) {
    res.status(404).json({ error: 'Unknown AI provider' });
    return;
  }

  const apiKey = getProviderApiKey(providerParam);
  if (!apiKey) {
    res.status(500).json({ error: getMissingProviderKeyMessage(providerParam) });
    return;
  }

  const pathParam = req.query.path;
  const pathSegments = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === 'string'
      ? [pathParam]
      : [];

  const url = new URL(req.url ?? '', 'http://localhost');
  const upstreamUrl = buildUpstreamUrl(providerParam, pathSegments, url.search);
  const headers = createProxyHeaders(req.headers, providerParam, apiKey);
  const body = await readRawBody(req);

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
  });

  res.status(upstream.status);
  const responseHeaders = filterResponseHeaders(upstream.headers);
  responseHeaders.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!upstream.body) {
    res.end();
    return;
  }

  Readable.fromWeb(upstream.body as never).pipe(res);
}
