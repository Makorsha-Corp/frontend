import { describe, expect, it } from 'vitest';

import {
  clientToImagePoint,
  computeFitLayout,
  imageToClientPoint,
  panForZoomAtAnchor,
} from '@/lib/documentScan/viewportCoords';

describe('computeFitLayout', () => {
  it('letterboxes a wide image in a tall container', () => {
    const layout = computeFitLayout(400, 300, 1600, 900);
    expect(layout.displayWidth).toBe(400);
    expect(layout.displayHeight).toBe(225);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(37.5);
  });
});

describe('clientToImagePoint round-trip', () => {
  const viewportRect = { left: 100, top: 50, width: 400, height: 300 } as DOMRect;
  const layout = computeFitLayout(400, 300, 1000, 1000);
  const imageWidth = 1000;
  const imageHeight = 1000;

  it('maps center at 1x zoom', () => {
    const clientX = viewportRect.left + layout.offsetX + layout.displayWidth / 2;
    const clientY = viewportRect.top + layout.offsetY + layout.displayHeight / 2;
    const point = clientToImagePoint(
      clientX,
      clientY,
      viewportRect,
      layout,
      imageWidth,
      imageHeight,
      { scale: 1, panX: 0, panY: 0 },
    );
    expect(point.x).toBeCloseTo(500, 0);
    expect(point.y).toBeCloseTo(500, 0);
  });

  it('round-trips through imageToClientPoint at 2x zoom with pan', () => {
    const viewport = { scale: 2, panX: -40, panY: 20 };
    const source = { x: 250, y: 750 };

    const client = imageToClientPoint(
      source,
      viewportRect,
      layout,
      imageWidth,
      imageHeight,
      viewport,
    );
    const back = clientToImagePoint(
      client.x,
      client.y,
      viewportRect,
      layout,
      imageWidth,
      imageHeight,
      viewport,
    );

    expect(back.x).toBeCloseTo(source.x, 0);
    expect(back.y).toBeCloseTo(source.y, 0);
  });
});

describe('panForZoomAtAnchor', () => {
  it('keeps anchor content point stable when zooming', () => {
    const layout = computeFitLayout(400, 300, 1000, 800);
    const anchorX = 200;
    const anchorY = 150;
    const prevScale = 1;
    const nextScale = 2;
    const startPan = { panX: 0, panY: 0 };

    const nextPan = panForZoomAtAnchor(
      anchorX,
      anchorY,
      layout,
      prevScale,
      nextScale,
      startPan.panX,
      startPan.panY,
    );

    const contentBefore = (anchorX - layout.offsetX - startPan.panX) / prevScale;
    const contentAfter = (anchorX - layout.offsetX - nextPan.panX) / nextScale;
    expect(contentAfter).toBeCloseTo(contentBefore, 5);
  });
});
