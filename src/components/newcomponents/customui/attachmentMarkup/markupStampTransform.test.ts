import { describe, expect, it } from 'vitest';

import type { MarkupStamp } from '@/types/attachment';

import { MIN_STAMP_WIDTH } from './markupStampGeometry';
import {
  applyMoveDrag,
  applyRotateDrag,
  applyUniformResize,
  removeStampById,
  updateStampById,
} from './markupStampTransform';

const stamp: MarkupStamp = {
  id: 'stamp-1',
  x: 0.2,
  y: 0.3,
  width: 0.28,
  height: 0.1,
};

describe('markupStampTransform', () => {
  it('moves stamp by pointer delta', () => {
    const moved = applyMoveDrag(stamp, { x: 0.3, y: 0.35 }, { x: 0.35, y: 0.38 });
    expect(moved.x).toBeCloseTo(0.25, 5);
    expect(moved.y).toBeCloseTo(0.33, 5);
    expect(moved.id).toBe('stamp-1');
  });

  it('uniformly resizes stamp from corner drag', () => {
    const resized = applyUniformResize(stamp, 2, { x: 0.5, y: 0.45 });
    expect(resized.width).toBeGreaterThan(stamp.width);
    expect(resized.height / resized.width).toBeCloseTo(stamp.height / stamp.width, 5);
  });

  it('enforces min width on resize', () => {
    const shrunk = applyUniformResize(stamp, 2, { x: 0.21, y: 0.31 });
    expect(shrunk.width).toBeGreaterThanOrEqual(MIN_STAMP_WIDTH);
  });

  it('rotates stamp based on pointer drag delta', () => {
    const centerX = stamp.x + stamp.width / 2;
    const centerY = stamp.y + stamp.height / 2;
    const rotated = applyRotateDrag(
      stamp,
      { x: centerX, y: centerY - 0.05 },
      { x: centerX + 0.05, y: centerY },
    );
    expect(rotated.rotation ?? 0).toBeCloseTo(90, 0);
  });

  it('updates and removes stamp by id', () => {
    const stamps = [stamp, { ...stamp, id: 'stamp-2', x: 0.5 }];
    const updated = updateStampById(stamps, 'stamp-2', { ...stamps[1]!, x: 0.55 });
    expect(updated[1]?.x).toBe(0.55);
    expect(removeStampById(stamps, 'stamp-1')).toHaveLength(1);
  });
});
