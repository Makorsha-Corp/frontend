import { loadOpenCv } from '@/lib/documentScan/loadOpenCv';

export interface RemovePaperBackgroundOptions {
  whiteThreshold?: number;
  padding?: number;
}

/**
 * Turn a photo of ink on white paper into a transparent PNG canvas.
 */
export async function removePaperBackground(
  source: HTMLCanvasElement | HTMLImageElement,
  options: RemovePaperBackgroundOptions = {},
): Promise<HTMLCanvasElement> {
  const whiteThreshold = options.whiteThreshold ?? 240;
  const padding = options.padding ?? 4;

  const cv = await loadOpenCv();
  const inputCanvas =
    source instanceof HTMLCanvasElement
      ? source
      : (() => {
          const canvas = document.createElement('canvas');
          canvas.width = source.naturalWidth || source.width;
          canvas.height = source.naturalHeight || source.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not create canvas context.');
          ctx.drawImage(source, 0, 0);
          return canvas;
        })();

  const src = cv.imread(inputCanvas);
  const rgba = new cv.Mat();
  const gray = new cv.Mat();
  const mask = new cv.Mat();
  const channels = new cv.MatVector();

  try {
    cv.cvtColor(src, rgba, cv.COLOR_RGBA2RGBA);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, mask, whiteThreshold, 255, cv.THRESH_BINARY_INV);

    cv.split(rgba, channels);
    const alpha = new cv.Mat();
    mask.copyTo(alpha);
    channels.set(3, alpha);
    cv.merge(channels, rgba);
    alpha.delete();

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let minX = rgba.cols;
    let minY = rgba.rows;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let i = 0; i < contours.size(); i += 1) {
      const rect = cv.boundingRect(contours.get(i));
      if (rect.width <= 0 || rect.height <= 0) continue;
      found = true;
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    contours.delete();
    hierarchy.delete();

    const cropX = found ? Math.max(0, minX - padding) : 0;
    const cropY = found ? Math.max(0, minY - padding) : 0;
    const cropW = found
      ? Math.min(rgba.cols - cropX, maxX - minX + padding * 2)
      : rgba.cols;
    const cropH = found
      ? Math.min(rgba.rows - cropY, maxY - minY + padding * 2)
      : rgba.rows;

    const rect = new cv.Rect(cropX, cropY, cropW, cropH);
    const cropped = rgba.roi(rect);
    const output = document.createElement('canvas');
    output.width = cropW;
    output.height = cropH;
    cv.imshow(output, cropped);
    cropped.delete();
    return output;
  } finally {
    src.delete();
    rgba.delete();
    gray.delete();
    mask.delete();
    channels.delete();
  }
}

export async function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) {
    throw new Error('Could not encode PNG.');
  }
  return new File([blob], fileName.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
}

export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode image.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context.');
    ctx.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
