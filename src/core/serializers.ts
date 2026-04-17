import TurndownService from 'turndown';

let turndownInstance: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });
  }
  return turndownInstance;
}

export function htmlToMarkdown(html: string): string {
  if (!html || html === '<p></p>') return '';
  return getTurndown().turndown(html);
}

export function htmlToText(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function estimateReadingTime(wordCount: number, wordsPerMinute = 238): number {
  if (wordCount === 0) return 0;
  return Math.ceil(wordCount / wordsPerMinute);
}
