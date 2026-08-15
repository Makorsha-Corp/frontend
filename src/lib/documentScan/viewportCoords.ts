import { clampCorner } from './geometry';
import type { Point } from './types';

export type ViewportTransform = {
  scale: number;
  panX: number;
  panY: number;
};

export type FitLayout = {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
};

export const MIN_VIEWPORT_SCALE = 1;
export const MAX_VIEWPORT_SCALE = 4;

/** Size image to fit inside container while preserving aspect ratio. */
export function computeFitLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): FitLayout {
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0 };
  }

  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  let displayWidth: number;
  let displayHeight: number;

  if (imageAspect > containerAspect) {
    displayWidth = containerWidth;
    displayHeight = containerWidth / imageAspect;
  } else {
    displayHeight = containerHeight;
    displayWidth = containerHeight * imageAspect;
  }

  return {
    displayWidth,
    displayHeight,
    offsetX: (containerWidth - displayWidth) / 2,
    offsetY: (containerHeight - displayHeight) / 2,
  };
}

export function displayToImagePoint(
  displayX: number,
  displayY: number,
  layout: FitLayout,
  imageWidth: number,
  imageHeight: number,
): Point {
  if (layout.displayWidth <= 0 || layout.displayHeight <= 0) {
    return { x: 0, y: 0 };
  }

  return clampCorner(
    {
      x: (displayX / layout.displayWidth) * imageWidth,
      y: (displayY / layout.displayHeight) * imageHeight,
    },
    imageWidth,
    imageHeight,
  );
}

export function imageToDisplayPoint(
  point: Point,
  layout: FitLayout,
  imageWidth: number,
  imageHeight: number,
): Point {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (point.x / imageWidth) * layout.displayWidth,
    y: (point.y / imageHeight) * layout.displayHeight,
  };
}

/** Map pointer position through viewport pan/zoom into image pixel coordinates. */
export function clientToImagePoint(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  layout: FitLayout,
  imageWidth: number,
  imageHeight: number,
  viewport: ViewportTransform,
): Point {
  const localX = clientX - viewportRect.left;
  const localY = clientY - viewportRect.top;
  const safeScale = viewport.scale > 0 ? viewport.scale : 1;

  const displayX = (localX - layout.offsetX - viewport.panX) / safeScale;
  const displayY = (localY - layout.offsetY - viewport.panY) / safeScale;

  return displayToImagePoint(displayX, displayY, layout, imageWidth, imageHeight);
}

/** Map image pixel to client coordinates (for loupe positioning tests). */
export function imageToClientPoint(
  point: Point,
  viewportRect: DOMRect,
  layout: FitLayout,
  imageWidth: number,
  imageHeight: number,
  viewport: ViewportTransform,
): Point {
  const display = imageToDisplayPoint(point, layout, imageWidth, imageHeight);
  return {
    x: viewportRect.left + layout.offsetX + viewport.panX + display.x * viewport.scale,
    y: viewportRect.top + layout.offsetY + viewport.panY + display.y * viewport.scale,
  };
}

export function clampViewportScale(scale: number): number {
  return Math.min(MAX_VIEWPORT_SCALE, Math.max(MIN_VIEWPORT_SCALE, scale));
}

/** Keep panned content from drifting fully off-screen. */
export function clampPan(
  panX: number,
  panY: number,
  layout: FitLayout,
  scale: number,
  containerWidth: number,
  containerHeight: number,
): { panX: number; panY: number } {
  const scaledWidth = layout.displayWidth * scale;
  const scaledHeight = layout.displayHeight * scale;

  const minPanX = Math.min(0, containerWidth - layout.offsetX - scaledWidth);
  const maxPanX = Math.max(0, -layout.offsetX);
  const minPanY = Math.min(0, containerHeight - layout.offsetY - scaledHeight);
  const maxPanY = Math.max(0, -layout.offsetY);

  return {
    panX: Math.min(maxPanX, Math.max(minPanX, panX)),
    panY: Math.min(maxPanY, Math.max(minPanY, panY)),
  };
}

/** Pan adjustment so `anchor` in viewport space stays fixed while scale changes. */
export function panForZoomAtAnchor(
  anchorX: number,
  anchorY: number,
  layout: FitLayout,
  prevScale: number,
  nextScale: number,
  panX: number,
  panY: number,
): { panX: number; panY: number } {
  const contentX = (anchorX - layout.offsetX - panX) / prevScale;
  const contentY = (anchorY - layout.offsetY - panY) / prevScale;

  return {
    panX: anchorX - layout.offsetX - contentX * nextScale,
    panY: anchorY - layout.offsetY - contentY * nextScale,
  };
}
