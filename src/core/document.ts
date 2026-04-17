import type { Editor } from '@tiptap/core';
import type { EditorContent } from '@writeflow/types';
import { htmlToMarkdown, htmlToText, countWords, estimateReadingTime } from './serializers';

export function getContent(editor: Editor): EditorContent {
  const html = editor.getHTML();
  const text = htmlToText(html);
  const wordCount = countWords(text);

  return {
    html,
    markdown: htmlToMarkdown(html),
    json: editor.getJSON() as Record<string, unknown>,
    text,
    wordCount,
    readingTime: estimateReadingTime(wordCount),
  };
}
