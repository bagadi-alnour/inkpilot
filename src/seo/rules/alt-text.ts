import type { SEOIssue } from '@inkpilot/types';

export interface ImageInfo {
  alt: string;
  src: string;
  from: number;
  to: number;
}

export function analyzeAltTexts(images: ImageInfo[]): SEOIssue[] {
  const issues: SEOIssue[] = [];

  for (const img of images) {
    if (!img.alt || img.alt.trim() === '') {
      issues.push({
        type: 'warning',
        code: 'empty-alt',
        message: 'Image is missing alt text. Add descriptive alt text for accessibility and SEO.',
        element: img.src,
      });
    } else if (img.alt.length < 5) {
      issues.push({
        type: 'info',
        code: 'short-alt',
        message: `Image alt text "${img.alt}" may be too short. Describe the image content.`,
        element: img.src,
      });
    } else if (img.alt.length > 125) {
      issues.push({
        type: 'info',
        code: 'long-alt',
        message: 'Image alt text is very long. Aim for a concise description under 125 characters.',
        element: img.src,
      });
    }
  }

  return issues;
}
