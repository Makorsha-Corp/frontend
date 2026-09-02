import { describe, expect, it } from 'vitest';

import type { MarkupStamp } from '@/types/attachment';

import {
  clampStamp,
  MIN_STAMP_WIDTH,
  pointInStampBody,
  rotatePointAround,
  stampCenter,
  stampWorldCorners,
} from './markupStampGeometry';

const baseStamp: MarkupStamp = {
  x: 0.2,
  y: 0.3,
  width: 0.28,
  height: 0.1,
};

describe('markupStampGeometry', () => {
  it('computes stamp center', () => {
    expect(stampCenter(baseStamp)).toEqual({ x: 0.34, y: 0.35 });
  });

  it('detects point inside axis-aligned stamp body', () => {
    expect(pointInStampBody({ x: 0.25, y: 0.32 }, baseStamp)).toBe(true);
    expect(pointInStampBody({ x: 0.05, y: 0.05 }, baseStamp)).toBe(false);
  });

  it('detects point inside rotated stamp body', () => {
    const rotated: MarkupStamp = { ...baseStamp, rotation: 45 };
    const center = stampCenter(rotated);
    expect(pointInStampBody(center, rotated)).toBe(true);
  });

  it('rotates points around center', () => {
    const center = { x: 0.5, y: 0.5 };
    const rotated = rotatePointAround({ x: 0.6, y: 0.5 }, center, 90);
    expect(rotated.x).toBeCloseTo(0.5, 5);
    expect(rotated.y).toBeCloseTo(0.6, 5);
  });

  it('returns four world corners', () => {
    expect(stampWorldCorners(baseStamp)).toHaveLength(4);
  });

  it('clamps stamp inside unit square and enforces min width', () => {
    const clamped = clampStamp({ x: 0.95, y: 0.95, width: 0.2, height: 0.08 });
    expect(clamped.width).toBeGreaterThanOrEqual(MIN_STAMP_WIDTH);
    expect(clamped.x).toBeLessThanOrEqual(1 - clamped.width);
    expect(clamped.y).toBeLessThanOrEqual(1 - clamped.height);
  });
});
