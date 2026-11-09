/**
 * URL slug from a title: lowercase, accents stripped, words joined by hyphens.
 * Letters from any script are kept (browsers percent-encode them in the URL).
 */
export function slugify(title: string, maxLength = 80): string {
  const slug = title
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength);
  // Prefer ending on a whole word.
  return cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut;
}
