import type { MarkupPoint, MarkupStroke } from '@/types/attachment';

function distanceBetween(a: MarkupPoint, b: MarkupPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distancePointToSegment(
  point: MarkupPoint,
  start: MarkupPoint,
  end: MarkupPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
  return distanceBetween(point, projection);
}

export function strokeHitTolerance(stroke: MarkupStroke): number {
  return Math.max(stroke.width * 1.75, 0.012);
}

export function pointHitsStroke(point: MarkupPoint, stroke: MarkupStroke): boolean {
  const tolerance = strokeHitTolerance(stroke);
  const points = stroke.points;
  if (points.length === 0) return false;
  if (points.length === 1) {
    return distanceBetween(point, points[0]!) <= tolerance;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (!start || !end) continue;
    if (distancePointToSegment(point, start, end) <= tolerance) {
      return true;
    }
  }
  return false;
}

export type StrokeHit = { kind: 'body'; id: string };

export function hitTestStrokes(
  point: MarkupPoint,
  strokes: MarkupStroke[],
  selectedStrokeId: string | null,
): StrokeHit | null {
  if (selectedStrokeId) {
    const selected = strokes.find((stroke) => stroke.id === selectedStrokeId);
    if (selected?.id && pointHitsStroke(point, selected)) {
      return { kind: 'body', id: selected.id };
    }
  }

  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    const stroke = strokes[index];
    if (!stroke?.id) continue;
    if (pointHitsStroke(point, stroke)) {
      return { kind: 'body', id: stroke.id };
    }
  }

  return null;
}
