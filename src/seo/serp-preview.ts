import type { SERPPreviewData } from '@writeflow/types';

export function generateSERPPreview(
  title: string,
  description: string,
  url?: string,
): SERPPreviewData {
  const displayTitle = title || 'Untitled';
  const displayDescription = description || 'No description available.';
  const displayUrl = url || 'https://example.com/your-article';

  return {
    title: displayTitle.length > 60 ? displayTitle.slice(0, 57) + '...' : displayTitle,
    description:
      displayDescription.length > 160
        ? displayDescription.slice(0, 157) + '...'
        : displayDescription,
    url: displayUrl,
    titleLength: displayTitle.length,
    descriptionLength: displayDescription.length,
  };
}
