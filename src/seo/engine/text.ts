/**
 * Locale-aware text segmentation. `Intl.Segmenter` handles languages without spaces
 * and most punctuation; it does treat abbreviations like "Dr." as sentence ends.
 */

const segmenters = new Map<string, Intl.Segmenter>();

function segmenter(locale: string, granularity: 'sentence' | 'word'): Intl.Segmenter {
  const key = `${locale}:${granularity}`;
  let instance = segmenters.get(key);
  if (!instance) {
    instance = new Intl.Segmenter(locale, { granularity });
    segmenters.set(key, instance);
  }
  return instance;
}

export function splitSentences(text: string, locale: string): string[] {
  return Array.from(segmenter(locale, 'sentence').segment(text), (s) => s.segment.trim()).filter(Boolean);
}

export function countWords(text: string, locale: string): number {
  let count = 0;
  for (const segment of segmenter(locale, 'word').segment(text)) {
    if (segment.isWordLike) count++;
  }
  return count;
}

/** FNV-1a, for issue ids that stay stable while text is unchanged. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Rough English syllable count, used only by the Flesch formula. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const groups = w.replace(/e$/, '').match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch reading ease (higher is easier). Meaningful for English text only. */
export function fleschReadingEase(text: string, locale: string): number {
  const sentences = Math.max(1, splitSentences(text, locale).length);
  const words: string[] = [];
  for (const segment of segmenter(locale, 'word').segment(text)) {
    if (segment.isWordLike) words.push(segment.segment);
  }
  if (!words.length) return 100;
  const syllableCount = words.reduce((sum, word) => sum + syllables(word), 0);
  return 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllableCount / words.length);
}
