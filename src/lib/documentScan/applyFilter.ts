import { warpDocument } from './detectCorners';
import type { OpenCv } from './loadOpenCv';
import type { OrderedCorners, ScanPresetId } from './types';

export function applyScanFilter(
  cv: OpenCv,
  sourceCanvas: HTMLCanvasElement,
  preset: ScanPresetId,
): HTMLCanvasElement {
  const src = cv.imread(sourceCanvas);

  try {
    if (preset === 'bw') {
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const dst = new cv.Mat();
      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        cv.adaptiveThreshold(
          blurred,
          dst,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          25,
          10,
        );
        const out = document.createElement('canvas');
        cv.imshow(out, dst);
        return out;
      } finally {
        gray.delete();
        blurred.delete();
        dst.delete();
      }
    }

    if (preset === 'grayscale') {
      const gray = new cv.Mat();
      const dst = new cv.Mat();
      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        clahe.apply(gray, dst);
        clahe.delete();
        const out = document.createElement('canvas');
        cv.imshow(out, dst);
        return out;
      } finally {
        gray.delete();
        dst.delete();
      }
    }

    const enhanced = new cv.Mat();
    const blurred = new cv.Mat();
    const dst = new cv.Mat();
    try {
      cv.convertScaleAbs(src, enhanced, 1.08, 4);
      cv.GaussianBlur(enhanced, blurred, new cv.Size(0, 0), 1.2);
      cv.addWeighted(enhanced, 1.35, blurred, -0.35, 0, dst);
      const out = document.createElement('canvas');
      cv.imshow(out, dst);
      return out;
    } finally {
      enhanced.delete();
      blurred.delete();
      dst.delete();
    }
  } finally {
    src.delete();
  }
}

export async function renderScannedCanvas(
  cv: OpenCv,
  sourceCanvas: HTMLCanvasElement,
  corners: OrderedCorners,
  outputWidth: number,
  outputHeight: number,
  preset: ScanPresetId,
): Promise<HTMLCanvasElement | null> {
  const warped = await warpDocument(sourceCanvas, corners, outputWidth, outputHeight);
  if (!warped) return null;
  return applyScanFilter(cv, warped, preset);
}
