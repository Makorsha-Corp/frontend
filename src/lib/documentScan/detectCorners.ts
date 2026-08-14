import type { JscanifyCornerPoints } from 'jscanify/client';

import { defaultCorners } from './orderCorners';
import { isUsableQuad } from './geometry';
import type { OpenCv } from './loadOpenCv';
import { bitmapToCanvas } from './loadOpenCv';
import type { OrderedCorners } from './types';
import { MAX_DETECT_EDGE } from './types';

let scannerPromise: Promise<InstanceType<(typeof import('jscanify/client'))['default']>> | null =
  null;

async function getScanner() {
  if (!scannerPromise) {
    scannerPromise = import('jscanify/client').then((module) => new module.default());
  }
  return scannerPromise;
}

export function cornersToJscanify(corners: OrderedCorners): JscanifyCornerPoints {
  const [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner] = corners;
  return {
    topLeftCorner,
    topRightCorner,
    bottomLeftCorner,
    bottomRightCorner,
  };
}

export function cornersFromJscanify(points: JscanifyCornerPoints): OrderedCorners {
  return [
    points.topLeftCorner,
    points.topRightCorner,
    points.bottomRightCorner,
    points.bottomLeftCorner,
  ];
}

export interface DetectCornersResult {
  corners: OrderedCorners;
  detected: boolean;
}

export async function detectCornersFromBitmap(
  cv: OpenCv,
  bitmap: ImageBitmap,
): Promise<DetectCornersResult> {
  const scanner = await getScanner();
  const fullWidth = bitmap.width;
  const fullHeight = bitmap.height;

  const detectCanvas = bitmapToCanvas(bitmap, MAX_DETECT_EDGE);
  const scaleX = fullWidth / detectCanvas.width;
  const scaleY = fullHeight / detectCanvas.height;
  const mat = cv.imread(detectCanvas);

  try {
    const contour = scanner.findPaperContour(mat) as { delete?: () => void } | null;
    if (!contour) {
      return { corners: defaultCorners(fullWidth, fullHeight), detected: false };
    }

    const raw = scanner.getCornerPoints(contour);
    contour.delete?.();

    if (
      !raw.topLeftCorner ||
      !raw.topRightCorner ||
      !raw.bottomLeftCorner ||
      !raw.bottomRightCorner
    ) {
      return { corners: defaultCorners(fullWidth, fullHeight), detected: false };
    }

    const scaled: JscanifyCornerPoints = {
      topLeftCorner: {
        x: raw.topLeftCorner.x * scaleX,
        y: raw.topLeftCorner.y * scaleY,
      },
      topRightCorner: {
        x: raw.topRightCorner.x * scaleX,
        y: raw.topRightCorner.y * scaleY,
      },
      bottomLeftCorner: {
        x: raw.bottomLeftCorner.x * scaleX,
        y: raw.bottomLeftCorner.y * scaleY,
      },
      bottomRightCorner: {
        x: raw.bottomRightCorner.x * scaleX,
        y: raw.bottomRightCorner.y * scaleY,
      },
    };

    const corners = cornersFromJscanify(scaled);
    if (!isUsableQuad(corners, fullWidth, fullHeight)) {
      return { corners: defaultCorners(fullWidth, fullHeight), detected: false };
    }

    return { corners, detected: true };
  } finally {
    mat.delete();
  }
}

export async function warpDocument(
  sourceCanvas: HTMLCanvasElement,
  corners: OrderedCorners,
  outputWidth: number,
  outputHeight: number,
): Promise<HTMLCanvasElement | null> {
  const scanner = await getScanner();
  return scanner.extractPaper(
    sourceCanvas,
    outputWidth,
    outputHeight,
    cornersToJscanify(corners),
  );
}
