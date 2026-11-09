const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

/**
 * Normalise a user-typed href for `setLink`.
 * Scheme-less input is promoted to https. Returns null when the scheme is not in
 * ALLOWED_LINK_PROTOCOLS or the value cannot be parsed, which keeps `javascript:`,
 * `data:` and friends out of the document regardless of tiptap's own validation.
 */
export function toSafeHref(input: string): string | null {
  // Strip control characters first, they are used to obfuscate "java\nscript:".
  const trimmed = input.trim().replace(/\p{Cc}/gu, '');
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    return ALLOWED_LINK_PROTOCOLS.includes(url.protocol as (typeof ALLOWED_LINK_PROTOCOLS)[number])
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
