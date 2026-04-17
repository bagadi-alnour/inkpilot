import type { ReadabilityResult, SEOIssue } from '@writeflow/types';

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (const char of w) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  if (w.endsWith('e') && count > 1) count--;
  return Math.max(count, 1);
}

export function analyzeReadability(text: string): ReadabilityResult {
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const issues: SEOIssue[] = [];

  const totalSentences = sentences.length || 1;
  const totalWords = words.length || 1;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const averageSentenceLength = totalWords / totalSentences;
  const averageParagraphSentences =
    paragraphs.length > 0
      ? sentences.length / paragraphs.length
      : sentences.length;

  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade =
    0.39 * (totalWords / totalSentences) +
    11.8 * (totalSyllables / totalWords) -
    15.59;

  // Flesch Reading Ease
  const fleschReadingEase =
    206.835 -
    1.015 * (totalWords / totalSentences) -
    84.6 * (totalSyllables / totalWords);

  if (averageSentenceLength > 25) {
    issues.push({
      type: 'warning',
      code: 'long-sentences',
      message: `Average sentence length is ${Math.round(averageSentenceLength)} words. Aim for under 25 for readability.`,
    });
  }

  if (averageParagraphSentences > 5) {
    issues.push({
      type: 'info',
      code: 'dense-paragraphs',
      message: `Paragraphs average ${Math.round(averageParagraphSentences)} sentences. Break up long paragraphs for easier reading.`,
    });
  }

  if (fleschReadingEase < 30) {
    issues.push({
      type: 'warning',
      code: 'difficult-reading',
      message: 'Content is very difficult to read. Consider simplifying language and shortening sentences.',
    });
  } else if (fleschReadingEase < 50) {
    issues.push({
      type: 'info',
      code: 'complex-reading',
      message: 'Content may be difficult for a general audience. Consider simplifying some sections.',
    });
  }

  return {
    averageSentenceLength,
    averageParagraphSentences,
    fleschKincaidGrade,
    fleschReadingEase,
    issues,
  };
}
