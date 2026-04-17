import type { AIProviderAdapter } from '@writeflow/types';

export async function suggestAltText(
  imageUrl: string,
  context: string,
  aiProvider?: AIProviderAdapter,
): Promise<string | null> {
  if (!aiProvider) return null;

  try {
    const suggestions = await aiProvider.suggestTitle(
      `Generate a concise, descriptive alt text for an image in the following context:\n\n${context}\n\nImage URL: ${imageUrl}`,
    );
    return suggestions[0] ?? null;
  } catch {
    return null;
  }
}
