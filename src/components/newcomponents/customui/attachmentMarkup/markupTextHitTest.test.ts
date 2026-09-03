import { describe, expect, it } from 'vitest';

import type { MarkupText } from '@/types/attachment';

import { hitTestTexts } from './markupTextHitTest';

const textA: MarkupText = {
  id: 'text-a',
  x: 0.1,
  y: 0.1,
  text: 'Hello',
  color: '#000',
  size: 0.04,
};

const textB: MarkupText = {
  id: 'text-b',
  x: 0.12,
  y: 0.12,
  text: 'World',
  color: '#000',
  size: 0.04,
};

describe('markupTextHitTest', () => {
  it('hits text body with reverse priority', () => {
    const hit = hitTestTexts({ x: 0.14, y: 0.14 }, [textA, textB], null);
    expect(hit).toEqual({ kind: 'body', id: 'text-b' });
  });

  it('prioritizes selected text', () => {
    const hit = hitTestTexts({ x: 0.11, y: 0.11 }, [textA, textB], 'text-a');
    expect(hit).toEqual({ kind: 'body', id: 'text-a' });
  });

  it('returns null for empty area', () => {
    expect(hitTestTexts({ x: 0.9, y: 0.9 }, [textA], null)).toBeNull();
  });
});
