/**
 * Client-side image optimization utilities
 */

export interface OptimizeOptions {
  maxDimension?: number; // longest side in px (default 2000)
  targetMaxBytes?: number; // soft cap (default 5MB)
  quality?: number; // initial quality (0-1)
  minQuality?: number; // minimal fallback quality
  mimeType?: string; // output mime type
  thumbnail?: boolean; // create thumbnail
  thumbnailSize?: number; // thumb square size
  thumbnailQuality?: number;
}

export interface OptimizedImageResult {
  originalFile: File; // possibly recompressed
  thumbnailFile?: File; // optional thumbnail
  wasOptimized: boolean;
  originalBytes: number;
  optimizedBytes: number;
}

const DEFAULTS: Required<Omit<OptimizeOptions, 'thumbnail'>> = {
  maxDimension: 2000,
  targetMaxBytes: 5 * 1024 * 1024,
  quality: 0.85,
  minQuality: 0.5,
  mimeType: 'image/jpeg',
  thumbnailSize: 480,
  thumbnailQuality: 0.7
};

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizedImageResult> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return {
      originalFile: file,
      wasOptimized: false,
      originalBytes: file.size,
      optimizedBytes: file.size
    };
  }

  const o = { ...DEFAULTS, ...opts };
  const img = await loadImage(file);
  const { width, height } = img;
  const scale = Math.min(1, o.maxDimension / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  let quality = o.quality;
  let blob = await drawToBlob(img, targetW, targetH, o.mimeType, quality);

  while (blob.size > o.targetMaxBytes && quality > o.minQuality) {
    quality -= 0.05;
    blob = await drawToBlob(img, targetW, targetH, o.mimeType, quality);
  }

  const optimizedFile = new File([blob], deriveFileName(file.name, o.mimeType), { type: o.mimeType, lastModified: Date.now() });

  let thumbnailFile: File | undefined;
  if (opts.thumbnail) {
    const thumbBlob = await drawToBlob(img, o.thumbnailSize, Math.round((height / width) * o.thumbnailSize), o.mimeType, o.thumbnailQuality);
    thumbnailFile = new File([thumbBlob], thumbName(file.name, o.mimeType), { type: o.mimeType, lastModified: Date.now() });
  }

  return {
    originalFile: optimizedFile,
    thumbnailFile,
    wasOptimized: optimizedFile.size < file.size || scale < 1,
    originalBytes: file.size,
    optimizedBytes: optimizedFile.size
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function drawToBlob(img: HTMLImageElement, w: number, h: number, mime: string, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), mime, quality));
}

function deriveFileName(original: string, mime: string) {
  const base = original.replace(/\.[^.]+$/, '');
  const ext = mimeExtension(mime);
  return `${base}-optimized${ext}`;
}

function thumbName(original: string, mime: string) {
  const base = original.replace(/\.[^.]+$/, '');
  const ext = mimeExtension(mime);
  return `${base}-thumb${ext}`;
}

function mimeExtension(mime: string) {
  switch (mime) {
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/webp': return '.webp';
    default: return '';
  }
}
