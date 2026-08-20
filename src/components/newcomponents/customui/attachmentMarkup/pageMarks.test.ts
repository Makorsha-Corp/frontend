import { describe, expect, it } from 'vitest';

import type { MarkupPayload } from '@/types/attachment';

import {
  emptyPageMarks,
  getPageMarks,
  isPayloadEmpty,
  setPageMarks,
} from './pageMarks';

describe('pageMarks', () => {
  it('returns empty marks for missing page', () => {
    const payload: MarkupPayload = { pages: {} };
    expect(getPageMarks(payload, 2)).toEqual(emptyPageMarks());
  });

  it('isolates marks by page', () => {
    const payload: MarkupPayload = {
      pages: {
        '2': {
          strokes: [
            {
              color: '#000',
              width: 0.01,
              points: [{ x: 0.1, y: 0.2 }],
            },
          ],
          texts: [],
          scribbles: [],
        },
      },
    };
    expect(getPageMarks(payload, 1)).toEqual(emptyPageMarks());
    expect(getPageMarks(payload, 2).strokes).toHaveLength(1);
  });

  it('detects empty payload', () => {
    expect(isPayloadEmpty({ pages: {} })).toBe(true);
    expect(
      isPayloadEmpty({
        pages: {
          '1': { strokes: [], texts: [], scribbles: [] },
        },
      }),
    ).toBe(true);
    expect(
      isPayloadEmpty({
        pages: {
          '1': {
            strokes: [{ color: '#000', width: 0.01, points: [{ x: 0, y: 0 }] }],
            texts: [],
            scribbles: [],
          },
        },
      }),
    ).toBe(false);
  });

  it('sets and clears page marks', () => {
    const payload: MarkupPayload = { pages: {} };
    const withMarks = setPageMarks(payload, 1, {
      strokes: [{ color: '#000', width: 0.01, points: [{ x: 0.5, y: 0.5 }] }],
      texts: [],
      scribbles: [],
    });
    expect(withMarks.pages['1']).toBeDefined();
    const cleared = setPageMarks(withMarks, 1, emptyPageMarks());
    expect(cleared.pages['1']).toBeUndefined();
  });
});
