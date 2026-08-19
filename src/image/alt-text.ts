import type { AIProviderAdapter } from '@inkpilot/types';

export async function suggestAltText(
  imageUrl: string,
  context: string,
  aiProvider?: AIProviderAdapter,
): Promise<string | null> {
  if (!aiProvider) return null;

  try {
    const result = await aiProvider.suggestMeta(
      `Generate a concise, descriptive alt text (max 125 characters) for an image.\n\nImage URL (for reference): ${imageUrl}\n\nSurrounding document context:\n\n${context}\n\nReturn only the alt text, nothing else.`,
    );
    return result || null;
  } catch {
    return null;
  }
}
