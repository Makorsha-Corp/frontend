import { describe, expect, it } from 'vitest';

import type { MarkupStamp } from '@/types/attachment';

import { rotateHandlePosition, stampCenter } from './markupStampGeometry';
import { hitTestStamps } from './markupStampHitTest';

const stampA: MarkupStamp = {
  id: 'stamp-a',
  x: 0.2,
  y: 0.3,
  width: 0.28,
  height: 0.1,
};

const stampB: MarkupStamp = {
  id: 'stamp-b',
  x: 0.21,
  y: 0.31,
  width: 0.28,
  height: 0.1,
};

describe('markupStampHitTest', () => {
  it('hits stamp body with reverse priority', () => {
    const hit = hitTestStamps({ x: 0.35, y: 0.35 }, [stampA, stampB], null);
    expect(hit).toEqual({ kind: 'body', id: 'stamp-b' });
  });

  it('prioritizes rotate handle on selected stamp', () => {
    const handle = rotateHandlePosition(stampA);
    const hit = hitTestStamps(handle, [stampA], 'stamp-a');
    expect(hit).toEqual({ kind: 'rotate', id: 'stamp-a' });
  });

  it('prioritizes resize handle on selected stamp', () => {
    const corner = { x: stampA.x + stampA.width, y: stampA.y + stampA.height };
    const hit = hitTestStamps(corner, [stampA], 'stamp-a');
    expect(hit?.kind).toBe('resize');
    expect(hit?.id).toBe('stamp-a');
  });

  it('returns null for empty area', () => {
    expect(hitTestStamps({ x: 0.01, y: 0.01 }, [stampA], null)).toBeNull();
  });

  it('uses center for body hit on rotated stamp', () => {
    const rotated: MarkupStamp = { ...stampA, rotation: 30 };
    const center = stampCenter(rotated);
    const hit = hitTestStamps(center, [rotated], null);
    expect(hit).toEqual({ kind: 'body', id: 'stamp-a' });
  });

  it('ignores stamps without id', () => {
    const noId: MarkupStamp = { x: 0.2, y: 0.3, width: 0.28, height: 0.1 };
    expect(hitTestStamps({ x: 0.34, y: 0.35 }, [noId], null)).toBeNull();
  });
});

describe('stamp id selection stability', () => {
  it('keeps selection on other stamp after delete', () => {
    const stamps = [stampA, stampB];
    const selectedId = 'stamp-b';
    const remaining = stamps.filter((stamp) => stamp.id !== 'stamp-a');
    const stillSelected = remaining.find((stamp) => stamp.id === selectedId);
    expect(stillSelected?.id).toBe('stamp-b');
  });
});
