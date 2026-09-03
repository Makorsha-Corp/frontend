import type { MarkupStroke } from '@/types/attachment';

import { renderStrokeWidth } from './markupDefaults';

function strokeToPolylinePoints(points: { x: number; y: number }[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export default function MarkupStrokeSelection({ stroke }: { stroke: MarkupStroke }) {
  return (
    <polyline
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth={renderStrokeWidth(stroke.width, 'pen') * 1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.85}
      points={strokeToPolylinePoints(stroke.points)}
    />
  );
}
