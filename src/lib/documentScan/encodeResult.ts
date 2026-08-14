import { MAX_UPLOAD_BYTES } from './types';
import type { ScanPresetId } from './types';

function replaceExtension(fileName: string, extension: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${base}${extension}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

function mimeForPreset(preset: ScanPresetId): { mimeType: string; extension: string; quality?: number } {
  if (preset === 'bw') {
    return { mimeType: 'image/png', extension: '.png' };
  }
  return { mimeType: 'image/jpeg', extension: '.jpg', quality: 0.85 };
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  preset: ScanPresetId,
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  const { mimeType, extension, quality } = mimeForPreset(preset);
  let blob = await canvasToBlob(canvas, mimeType, quality);
  if (!blob) throw new Error('Could not encode scanned image.');

  if (blob.size <= MAX_UPLOAD_BYTES) {
    return { blob, mimeType, extension };
  }

  if (preset === 'bw') {
    blob = (await canvasToBlob(canvas, 'image/jpeg', 0.8)) ?? blob;
    if (blob.size <= MAX_UPLOAD_BYTES) {
      return { blob, mimeType: 'image/jpeg', extension: '.jpg' };
    }
  } else if (quality && quality > 0.7) {
    blob = (await canvasToBlob(canvas, mimeType, 0.7)) ?? blob;
    if (blob.size <= MAX_UPLOAD_BYTES) {
      return { blob, mimeType, extension };
    }
  }

  const scaled = document.createElement('canvas');
  scaled.width = Math.round(canvas.width * 0.85);
  scaled.height = Math.round(canvas.height * 0.85);
  const ctx = scaled.getContext('2d');
  if (!ctx) throw new Error('Could not encode scanned image.');
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);

  const fallbackMime = preset === 'bw' ? 'image/jpeg' : mimeType;
  blob = (await canvasToBlob(scaled, fallbackMime, 0.75)) ?? blob;
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Scanned file is too large after compression.');
  }

  return {
    blob,
    mimeType: fallbackMime,
    extension: fallbackMime === 'image/jpeg' ? '.jpg' : extension,
  };
}

export async function canvasToUploadFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  preset: ScanPresetId,
): Promise<File> {
  const { blob, mimeType, extension } = await encodeCanvas(canvas, preset);
  const trimmed = fileName.trim() || 'scan';
  const capped = trimmed.length > 255 ? trimmed.slice(0, 255) : trimmed;
  const normalized = capped.includes('.') ? replaceExtension(capped, extension) : `${capped}${extension}`;

  return new File([blob], normalized, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
