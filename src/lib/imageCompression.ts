import { convertHeicToJpeg, isHeicFile } from '@/lib/heicConvert';

import { fitWithin } from './documentScan/geometry';

const COMPRESS_MAX_EDGE = 2400;
const COMPRESS_QUALITY = 0.82;

function replaceExtension(fileName: string, extension: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${base}${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

export function shouldCompressOriginal(file: File): boolean {
  if (file.type === 'image/png' || file.type === 'image/webp') return false;
  if (file.type === 'application/pdf') return false;
  return file.type.startsWith('image/');
}

export async function compressOriginal(file: File): Promise<File> {
  if (!shouldCompressOriginal(file)) return file;

  let working = file;
  if (isHeicFile(file)) {
    try {
      working = await convertHeicToJpeg(file);
    } catch {
      return file;
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(working);
  } catch {
    return file;
  }

  try {
    const fitted = fitWithin(bitmap.width, bitmap.height, COMPRESS_MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = fitted.width;
    canvas.height = fitted.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, fitted.width, fitted.height);

    const blob = await canvasToBlob(canvas, COMPRESS_QUALITY);
    if (!blob || blob.size >= file.size) return file;

    const name = replaceExtension(file.name, '.jpg');
    return new File([blob], name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
