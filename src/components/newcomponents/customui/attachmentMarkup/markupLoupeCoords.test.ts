import { describe, expect, it } from 'vitest';

import {
  LOUPE_DRAW_ZOOM,
  LOUPE_RECT_HEIGHT,
  LOUPE_RECT_WIDTH,
  imagePixelToNormalized,
  loupeLocalToImagePixel,
  loupeLocalToNormalized,
  loupeSourceRect,
  loupeStrokeWidth,
} from './markupLoupeCoords';

describe('markupLoupeCoords', () => {
  const imageWidth = 1600;
  const imageHeight = 1200;
  const center = { x: 800, y: 600 };

  it('maps loupe center to normalized image coordinates', () => {
    const normalized = loupeLocalToNormalized(
      LOUPE_RECT_WIDTH / 2,
      LOUPE_RECT_HEIGHT / 2,
      center,
      imageWidth,
      imageHeight,
    );
    expect(normalized.x).toBeCloseTo(0.5, 3);
    expect(normalized.y).toBeCloseTo(0.5, 3);
  });

  it('maps loupe corners to source rect edges', () => {
    const { sx, sy, sw, sh } = loupeSourceRect(center, imageWidth, imageHeight);
    const topLeft = loupeLocalToImagePixel(0, 0, center, imageWidth, imageHeight);
    expect(topLeft.x).toBeCloseTo(sx, 4);
    expect(topLeft.y).toBeCloseTo(sy, 4);

    const bottomRight = loupeLocalToImagePixel(
      LOUPE_RECT_WIDTH,
      LOUPE_RECT_HEIGHT,
      center,
      imageWidth,
      imageHeight,
    );
    expect(bottomRight.x).toBeCloseTo(sx + sw, 4);
    expect(bottomRight.y).toBeCloseTo(sy + sh, 4);
  });

  it('scales stroke width down by loupe zoom', () => {
    expect(loupeStrokeWidth(0.018, LOUPE_DRAW_ZOOM)).toBeCloseTo(0.006, 5);
  });

  it('clamps loupe stroke width to zoom-adjusted floor', () => {
    expect(loupeStrokeWidth(0.001, LOUPE_DRAW_ZOOM)).toBeCloseTo(0.004, 5);
  });

  it('round-trips image pixel through normalized', () => {
    const pixel = { x: 400, y: 300 };
    const normalized = imagePixelToNormalized(pixel, imageWidth, imageHeight);
    expect(normalized.x * imageWidth).toBeCloseTo(pixel.x, 4);
    expect(normalized.y * imageHeight).toBeCloseTo(pixel.y, 4);
  });
});
