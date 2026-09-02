import type { MarkupStamp } from '@/types/attachment';

import {
  rotateHandlePosition,
  stampCenter,
  stampWorldCorners,
  STAMP_HANDLE_RADIUS,
} from './markupStampGeometry';

export interface MarkupStampSelectionProps {
  stamp: MarkupStamp;
}

export default function MarkupStampSelection({ stamp }: MarkupStampSelectionProps) {
  const corners = stampWorldCorners(stamp);
  const rotateHandle = rotateHandlePosition(stamp);
  const center = stampCenter(stamp);
  const topCenter = corners[0] && corners[1]
    ? {
        x: (corners[0].x + corners[1].x) / 2,
        y: (corners[0].y + corners[1].y) / 2,
      }
    : center;

  const boxPoints = corners.map((corner) => `${corner.x},${corner.y}`).join(' ');

  return (
    <g aria-hidden>
      <polygon
        points={boxPoints}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={0.004}
        strokeDasharray="0.01 0.008"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={topCenter.x}
        y1={topCenter.y}
        x2={rotateHandle.x}
        y2={rotateHandle.y}
        stroke="hsl(var(--primary))"
        strokeWidth={0.003}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={rotateHandle.x}
        cy={rotateHandle.y}
        r={STAMP_HANDLE_RADIUS}
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth={0.003}
        vectorEffect="non-scaling-stroke"
      />
      {corners.map((corner, index) => (
        <circle
          key={`corner-${index}`}
          cx={corner.x}
          cy={corner.y}
          r={STAMP_HANDLE_RADIUS}
          fill="hsl(var(--primary))"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}
