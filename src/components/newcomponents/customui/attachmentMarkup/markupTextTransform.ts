import type { MarkupPoint, MarkupText } from '@/types/attachment';

export function applyTextMoveDrag(
  startText: MarkupText,
  startPoint: MarkupPoint,
  currentPoint: MarkupPoint,
): MarkupText {
  return {
    ...startText,
    x: startText.x + (currentPoint.x - startPoint.x),
    y: startText.y + (currentPoint.y - startPoint.y),
  };
}

export function updateTextById(
  texts: MarkupText[],
  id: string,
  text: MarkupText,
): MarkupText[] {
  return texts.map((current) => (current.id === id ? text : current));
}

export function removeTextById(texts: MarkupText[], id: string): MarkupText[] {
  return texts.filter((current) => current.id !== id);
}
