export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function resizeImage(
  file: File,
  targetWidth: number,
): Promise<ResizedImage | null> {
  if (typeof document === 'undefined') return null;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return null;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width <= targetWidth) {
        resolve(null);
        return;
      }

      const ratio = targetWidth / img.width;
      const targetHeight = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({ blob, width: targetWidth, height: targetHeight });
        },
        file.type,
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

export async function generateResponsiveSizes(
  file: File,
  sizes: number[],
): Promise<ResizedImage[]> {
  const results: ResizedImage[] = [];

  for (const size of sizes) {
    const resized = await resizeImage(file, size);
    if (resized) {
      results.push(resized);
    }
  }

  return results;
}
