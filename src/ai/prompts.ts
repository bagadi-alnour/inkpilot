import type { AITone, AIIntent } from '@inkpilot/types';

export function buildRewritePrompt(params: {
  selectedText: string;
  surroundingBefore: string;
  surroundingAfter: string;
  tone: AITone;
  intent: AIIntent;
  preserveMeaning: boolean;
}): string {
  const toneDescriptions: Record<AITone, string> = {
    formal: 'Use a professional, authoritative voice. Avoid contractions and slang.',
    casual: 'Use a friendly, conversational tone. Contractions and approachable language are fine.',
    persuasive: 'Use compelling, action-oriented language. Appeal to the reader\'s interests.',
  };

  const intentDescriptions: Record<AIIntent, string> = {
    simplify: 'Make the text simpler and easier to understand. Use shorter sentences and common words.',
    expand: 'Add more detail, depth, and explanation. Flesh out the ideas more fully.',
    clarify: 'Make the text clearer and more precise. Remove ambiguity and improve structure.',
  };

  return `You are rewriting a section of text within a larger article. Your goal is to improve the selected text while maintaining coherence with the surrounding content.

CONTEXT BEFORE THE SELECTION:
"""
${params.surroundingBefore}
"""

TEXT TO REWRITE:
"""
${params.selectedText}
"""

CONTEXT AFTER THE SELECTION:
"""
${params.surroundingAfter}
"""

INSTRUCTIONS:
- Tone: ${params.tone} — ${toneDescriptions[params.tone]}
- Intent: ${params.intent} — ${intentDescriptions[params.intent]}
${params.preserveMeaning ? '- IMPORTANT: Preserve the original meaning exactly. Do not add new information or change the message.' : ''}
- Match the style and voice of the surrounding text
- Maintain any formatting (bold, italic, links) that exists
- Return ONLY the rewritten text, with no preamble, explanation, or quotes

REWRITTEN TEXT:`;
}

export function buildRestructurePrompt(params: {
  fullContent: string;
  headings: string[];
  instructions?: string;
}): string {
  return `You are restructuring an article to improve its flow, organization, and readability.

CURRENT ARTICLE:
"""
${params.fullContent}
"""

CURRENT HEADING STRUCTURE:
${params.headings.map((h) => `- ${h}`).join('\n')}

${params.instructions ? `SPECIFIC INSTRUCTIONS:\n${params.instructions}\n` : ''}
TASK:
- Analyze the article structure
- Suggest improvements to heading hierarchy
- Reorganize content for better flow
- Identify any missing sections
- Return the restructured article in full

Return the complete restructured article in HTML format.`;
}

export function buildTitleSuggestionPrompt(content: string): string {
  return `Based on the following article content, suggest 3 compelling, SEO-friendly title alternatives. Each title should be 30-60 characters long.

ARTICLE CONTENT (first 500 chars):
"""
${content.slice(0, 500)}
"""

Return exactly 3 titles, one per line, with no numbering or bullet points.`;
}

export function buildMetaSuggestionPrompt(content: string): string {
  return `Based on the following article content, write a compelling meta description for search engines. The description should be 120-160 characters, summarize the key value of the article, and encourage clicks.

ARTICLE CONTENT (first 500 chars):
"""
${content.slice(0, 500)}
"""

Return only the meta description, with no quotes or explanation.`;
}
