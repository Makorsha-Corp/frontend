import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { MarkupPayload, PageMarks } from '@/types/attachment';

import { MAX_MARKUP_POINTS, countMarkupPoints, wouldExceedMarkupBudget } from './markupPointBudget';
import { emptyPageMarks } from './pageMarks';
import { ensurePageMarkStampIds } from './stampIds';
import { removeStampById, updateStampById } from './markupStampTransform';

describe('markupPointBudget', () => {
  it('counts stroke points texts and stamps', () => {
    const payload: MarkupPayload = {
      pages: {
        '1': {
          ...emptyPageMarks(),
          strokes: [
            {
              color: '#000',
              width: 0.01,
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ],
            },
          ],
          texts: [{ x: 0.1, y: 0.1, text: 'hi', color: '#000', size: 0.04 }],
          stamps: [{ id: 's1', x: 0, y: 0, width: 0.1, height: 0.05 }],
        },
      },
    };
    expect(countMarkupPoints(payload)).toBe(4);
  });

  it('detects when next marks would exceed budget', () => {
    const payload: MarkupPayload = { pages: {} };
    const huge: PageMarks = {
      ...emptyPageMarks(),
      strokes: [
        {
          color: '#000',
          width: 0.01,
          points: Array.from({ length: MAX_MARKUP_POINTS + 1 }, (_, index) => ({
            x: index / MAX_MARKUP_POINTS,
            y: 0.5,
          })),
        },
      ],
    };
    expect(wouldExceedMarkupBudget(payload, 1, huge)).toBe(true);
  });
});

describe('stampIds', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'generated-id',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('assigns ids to stamps missing them', () => {
    const marks: PageMarks = {
      ...emptyPageMarks(),
      stamps: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.1 }],
    };
    const next = ensurePageMarkStampIds(marks);
    expect(next.stamps[0]?.id).toBe('generated-id');
  });
});

describe('markupStampTransform by id', () => {
  it('updates and removes stamp by id', () => {
    const stamps = [
      { id: 'a', x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
      { id: 'b', x: 0.5, y: 0.5, width: 0.2, height: 0.1 },
    ];
    const updated = updateStampById(stamps, 'b', { ...stamps[1]!, x: 0.55 });
    expect(updated[1]?.x).toBe(0.55);
    expect(removeStampById(stamps, 'a')).toHaveLength(1);
  });
});
