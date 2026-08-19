// EXAMPLE ONLY — not production-ready.
//
// This route forwards any request straight to OpenAI/Anthropic using the server's API key,
// with no authentication, authorisation, request validation, or rate limiting. Anyone who can
// reach it can spend your API budget. Before shipping something like this, add at minimum:
// caller authentication, a per-user rate limit, and an allowlist of upstream paths and models.

import { type NextRequest } from 'next/server';
import {
  buildUpstreamUrl,
  createProxyHeaders,
  filterResponseHeaders,
  getMissingProviderKeyMessage,
  getProviderApiKey,
  isAIProvider,
} from '@/lib/aiProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    provider: string;
    path?: string[];
  }>;
};

async function forward(request: NextRequest, context: RouteContext) {
  const { provider, path } = await context.params;

  if (!isAIProvider(provider)) {
    return Response.json({ error: 'Unknown AI provider' }, { status: 404 });
  }

  const apiKey = getProviderApiKey(provider);
  if (!apiKey) {
    return Response.json(
      { error: getMissingProviderKeyMessage(provider) },
      { status: 500 },
    );
  }

  const upstreamUrl = buildUpstreamUrl(provider, path ?? [], request.nextUrl.search);

  // Buffer body: forwarding `request.body` (ReadableStream) requires `duplex: 'half'` in Node's
  // fetch and breaks easily; buffering matches the Pages-router proxy and works for JSON APIs.
  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const bodyInit = body && body.byteLength > 0 ? body : undefined;

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: createProxyHeaders(request.headers, provider, apiKey),
    body: bodyInit,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: filterResponseHeaders(upstream.headers),
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
