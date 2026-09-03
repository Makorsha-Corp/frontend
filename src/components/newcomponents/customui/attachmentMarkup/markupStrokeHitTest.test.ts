import { describe, expect, it } from 'vitest';

import type { MarkupStroke } from '@/types/attachment';

import { hitTestStrokes } from './markupStrokeHitTest';

const strokeA: MarkupStroke = {
  id: 'stroke-a',
  color: '#000',
  width: 0.02,
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.3, y: 0.1 },
  ],
};

describe('markupStrokeHitTest', () => {
  it('hits stroke near polyline', () => {
    const hit = hitTestStrokes({ x: 0.2, y: 0.11 }, [strokeA], null);
    expect(hit).toEqual({ kind: 'body', id: 'stroke-a' });
  });

  it('returns null away from stroke', () => {
    expect(hitTestStrokes({ x: 0.2, y: 0.5 }, [strokeA], null)).toBeNull();
  });

  it('prioritizes selected stroke', () => {
    const hit = hitTestStrokes({ x: 0.11, y: 0.11 }, [strokeA], 'stroke-a');
    expect(hit).toEqual({ kind: 'body', id: 'stroke-a' });
  });
});
