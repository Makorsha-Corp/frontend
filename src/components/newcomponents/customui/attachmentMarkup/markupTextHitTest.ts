import type { MarkupPoint, MarkupText } from '@/types/attachment';

import { pointInTextMark } from './markupTextGeometry';
import { findTextById } from './textIds';

export type TextHit = { kind: 'body'; id: string };

export function hitTestTexts(
  point: MarkupPoint,
  texts: MarkupText[],
  selectedTextId: string | null,
): TextHit | null {
  const selectedText = findTextById(texts, selectedTextId);
  if (selectedText?.id && pointInTextMark(point, selectedText)) {
    return { kind: 'body', id: selectedText.id };
  }

  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index];
    if (!text?.id) continue;
    if (pointInTextMark(point, text)) {
      return { kind: 'body', id: text.id };
    }
  }

  return null;
}
