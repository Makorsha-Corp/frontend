import { cn } from '@/lib/utils';
import type { MarkupStroke, PageMarks } from '@/types/attachment';

import { renderStrokeWidth } from './markupDefaults';

export interface MarkupOverlayProps {
  marks: PageMarks;
  interactive?: boolean;
  className?: string;
  /** When set, overrides stroke/text colors (read-only other-user layers). */
  layerColor?: string;
}

function strokeToPolylinePoints(
  points: { x: number; y: number }[],
): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function strokeColor(stroke: MarkupStroke, layerColor?: string): string {
  return layerColor ?? stroke.color;
}

export default function MarkupOverlay({
  marks,
  interactive = false,
  className,
  layerColor,
}: MarkupOverlayProps) {
  return (
    <svg
      className={cn(
        'absolute inset-0 h-full w-full',
        !interactive && 'pointer-events-none',
        className,
      )}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden={!interactive}
    >
      {marks.strokes.map((stroke, index) => (
        <polyline
          key={`stroke-${index}`}
          fill="none"
          stroke={strokeColor(stroke, layerColor)}
          strokeWidth={renderStrokeWidth(stroke.width, 'pen')}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={strokeToPolylinePoints(stroke.points)}
        />
      ))}
      {marks.scribbles.map((stroke, index) => (
        <polyline
          key={`scribble-${index}`}
          fill="none"
          stroke={strokeColor(stroke, layerColor)}
          strokeWidth={renderStrokeWidth(stroke.width, 'scribble')}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={strokeToPolylinePoints(stroke.points)}
        />
      ))}
      {marks.texts.map((item, index) => (
        <text
          key={`text-${index}`}
          x={item.x}
          y={item.y}
          fill={layerColor ?? item.color}
          fontSize={item.size}
          dominantBaseline="hanging"
          style={{ userSelect: 'none' }}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}
