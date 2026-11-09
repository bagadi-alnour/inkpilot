/**
 * Fixed-window rate limit kept in this process's memory: fine for a demo or a single
 * server, wrong for serverless or several instances, where each copy counts alone.
 * In production, use your platform's limiter or a shared store (for example
 * `@upstash/ratelimit`) with the same shape: `take(key)` -> allowed or retry-after.
 */
export function createRateLimit({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return function take(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
    const now = Date.now();
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      // Drop expired windows now and then so the map doesn't grow without bound.
      if (windows.size > 10_000) for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      windows.set(key, { start: now, count: 1 });
      return { ok: true };
    }
    if (current.count >= limit) return { ok: false, retryAfterSeconds: Math.ceil((current.start + windowMs - now) / 1000) };
    current.count++;
    return { ok: true };
  };
}

/** The caller's address as the proxy in front of the app reports it. Prefer a user id when you have one. */
export function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
