export interface WebpOptimizeOptions {
  /** Maximum width or height in pixels while preserving aspect ratio. */
  maxDim?: number;
  /** WebP encoding quality in range [0, 1]. */
  quality?: number;
}

/**
 * Convert and resize a raster image File (PNG/JPEG/WebP) to a compact WebP File in the browser.
 * Falls back to the original file if decoding or WebP encoding is unsupported or larger.
 */
export async function convertImageFileToWebp(
  file: File,
  { maxDim = 1280, quality = 0.84 }: WebpOptimizeOptions = {}
): Promise<File> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        const resized = width > maxDim || height > maxDim;
        if (resized) {
          if (width > height) {
            height = Math.max(1, Math.round((height * maxDim) / width));
            width = maxDim;
          } else {
            width = Math.max(1, Math.round((width * maxDim) / height));
            height = maxDim;
          }
        }

        // Skip re-encoding if already WebP within max dimension and compact
        if (file.type === 'image/webp' && !resized && file.size <= 350 * 1024) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || (blob.type !== 'image/webp') || (!resized && blob.size >= file.size)) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
            resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() }));
          },
          'image/webp',
          quality
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

