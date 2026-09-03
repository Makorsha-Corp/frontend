import type { MarkupPoint, MarkupText } from '@/types/attachment';

/** Approximate normalized bounds for SVG text (dominantBaseline hanging). */
export function textMarkBounds(text: MarkupText): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const charWidth = text.size * 0.55;
  const width = Math.max(text.size * 2, text.text.length * charWidth);
  const height = text.size * 1.25;
  return {
    x: text.x,
    y: text.y,
    width,
    height,
  };
}

export function pointInTextMark(point: MarkupPoint, text: MarkupText): boolean {
  const bounds = textMarkBounds(text);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
