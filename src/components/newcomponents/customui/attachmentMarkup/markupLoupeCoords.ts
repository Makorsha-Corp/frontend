import type { MarkupPoint } from '@/types/attachment';

import { PEN_RENDER_FLOOR } from './markupDefaults';

export const LOUPE_DRAW_ZOOM = 3;
export const LOUPE_RECT_WIDTH = 280;
export const LOUPE_RECT_HEIGHT = 200;

export interface ImagePixelPoint {
  x: number;
  y: number;
}

export interface LoupeSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function loupeSourceRect(
  center: ImagePixelPoint,
  imageWidth: number,
  imageHeight: number,
  rectWidth = LOUPE_RECT_WIDTH,
  rectHeight = LOUPE_RECT_HEIGHT,
  zoom = LOUPE_DRAW_ZOOM,
): LoupeSourceRect {
  const sw = rectWidth / zoom;
  const sh = rectHeight / zoom;
  const sx = clamp(center.x - sw / 2, 0, Math.max(0, imageWidth - sw));
  const sy = clamp(center.y - sh / 2, 0, Math.max(0, imageHeight - sh));
  return {
    sx,
    sy,
    sw: Math.min(sw, imageWidth - sx),
    sh: Math.min(sh, imageHeight - sy),
  };
}

export function loupeLocalToImagePixel(
  localX: number,
  localY: number,
  center: ImagePixelPoint,
  imageWidth: number,
  imageHeight: number,
  rectWidth = LOUPE_RECT_WIDTH,
  rectHeight = LOUPE_RECT_HEIGHT,
  zoom = LOUPE_DRAW_ZOOM,
): ImagePixelPoint {
  const { sx, sy, sw, sh } = loupeSourceRect(
    center,
    imageWidth,
    imageHeight,
    rectWidth,
    rectHeight,
    zoom,
  );
  return {
    x: sx + (localX / rectWidth) * sw,
    y: sy + (localY / rectHeight) * sh,
  };
}

export function imagePixelToNormalized(
  point: ImagePixelPoint,
  imageWidth: number,
  imageHeight: number,
): MarkupPoint {
  return {
    x: Math.min(1, Math.max(0, point.x / imageWidth)),
    y: Math.min(1, Math.max(0, point.y / imageHeight)),
  };
}

export function loupeLocalToNormalized(
  localX: number,
  localY: number,
  center: ImagePixelPoint,
  imageWidth: number,
  imageHeight: number,
  rectWidth = LOUPE_RECT_WIDTH,
  rectHeight = LOUPE_RECT_HEIGHT,
  zoom = LOUPE_DRAW_ZOOM,
): MarkupPoint {
  const pixel = loupeLocalToImagePixel(
    localX,
    localY,
    center,
    imageWidth,
    imageHeight,
    rectWidth,
    rectHeight,
    zoom,
  );
  return imagePixelToNormalized(pixel, imageWidth, imageHeight);
}

export function loupeStrokeWidth(baseWidth: number, zoom = LOUPE_DRAW_ZOOM): number {
  return Math.max(baseWidth / zoom, PEN_RENDER_FLOOR / zoom);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
