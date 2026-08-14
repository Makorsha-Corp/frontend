import { describe, expect, it } from 'vitest';

import { isUsableQuad, outputSizeFor } from '@/lib/documentScan/geometry';
import { orderCorners } from '@/lib/documentScan/orderCorners';
import { shouldCompressOriginal } from '@/lib/imageCompression';

describe('orderCorners', () => {
  it('orders four arbitrary points into TL/TR/BR/BL', () => {
    const corners = orderCorners([
      { x: 100, y: 0 },
      { x: 0, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ]);

    expect(corners[0]).toEqual({ x: 0, y: 0 });
    expect(corners[1]).toEqual({ x: 100, y: 0 });
    expect(corners[2]).toEqual({ x: 100, y: 200 });
    expect(corners[3]).toEqual({ x: 0, y: 200 });
  });
});

describe('isUsableQuad', () => {
  it('rejects tiny quads', () => {
    const corners = orderCorners([
      { x: 10, y: 10 },
      { x: 12, y: 10 },
      { x: 12, y: 12 },
      { x: 10, y: 12 },
    ]);

    expect(isUsableQuad(corners, 1000, 1000)).toBe(false);
  });

  it('accepts a large convex quad', () => {
    const corners = orderCorners([
      { x: 50, y: 50 },
      { x: 950, y: 60 },
      { x: 940, y: 940 },
      { x: 60, y: 930 },
    ]);

    expect(isUsableQuad(corners, 1000, 1000)).toBe(true);
  });
});

describe('outputSizeFor', () => {
  it('caps the long edge at 2200px', () => {
    const corners = orderCorners([
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 3000 },
      { x: 0, y: 3000 },
    ]);

    const size = outputSizeFor(corners);
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(2200);
  });
});

describe('shouldCompressOriginal', () => {
  it('compresses jpeg and heic but not png/webp/pdf', () => {
    expect(shouldCompressOriginal(new File(['a'], 'a.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(shouldCompressOriginal(new File(['a'], 'a.heic', { type: 'image/heic' }))).toBe(true);
    expect(shouldCompressOriginal(new File(['a'], 'a.png', { type: 'image/png' }))).toBe(false);
    expect(shouldCompressOriginal(new File(['a'], 'a.webp', { type: 'image/webp' }))).toBe(false);
    expect(shouldCompressOriginal(new File(['a'], 'a.pdf', { type: 'application/pdf' }))).toBe(false);
  });
});
