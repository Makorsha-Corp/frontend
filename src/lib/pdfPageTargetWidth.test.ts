import { describe, expect, it, vi } from 'vitest';

import { bucketPdfPageWidth } from '@/lib/pdfPageTargetWidth';

describe('bucketPdfPageWidth', () => {
  it('returns default when container has no size', () => {
    expect(bucketPdfPageWidth(0, 0)).toBe(1600);
  });

  it('buckets width-only request', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    expect(bucketPdfPageWidth(800)).toBe(1200);
    vi.unstubAllGlobals();
  });

  it('uses height and page aspect when height-limited', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    // 600px tall viewport, portrait page (aspect 0.77) → heightCandidate ~577 → buckets to 800+
    const result = bucketPdfPageWidth(986, 600, 612 / 792);
    expect(result).toBeGreaterThanOrEqual(800);
    vi.unstubAllGlobals();
  });
});
