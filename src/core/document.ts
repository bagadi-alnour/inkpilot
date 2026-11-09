import type { Editor } from '@tiptap/core';
import type { EditorContent } from '@inkpilot/types';
import { htmlToMarkdown, countWords, estimateReadingTime } from './serializers';

export function getContent(editor: Editor): EditorContent {
  const html = editor.getHTML();
  // From the document, not the HTML: textContent would glue blocks together ("endStart").
  const text = editor.getText({ blockSeparator: '\n\n' });
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
