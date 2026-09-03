import type { MarkupPoint, MarkupStroke } from '@/types/attachment';

export function applyStrokeMoveDrag(
  startStroke: MarkupStroke,
  startPoint: MarkupPoint,
  currentPoint: MarkupPoint,
): MarkupStroke {
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  return {
    ...startStroke,
    points: startStroke.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    })),
  };
}

export function updateStrokeById(
  strokes: MarkupStroke[],
  id: string,
  stroke: MarkupStroke,
): MarkupStroke[] {
  return strokes.map((current) => (current.id === id ? stroke : current));
}

export function removeStrokeById(strokes: MarkupStroke[], id: string): MarkupStroke[] {
  return strokes.filter((current) => current.id !== id);
}
