import { cn } from '@/lib/utils';
import type { MarkupStamp, MarkupStroke, PageMarks } from '@/types/attachment';
import type { SavedStamp } from '@/types/savedStamp';

import { renderStrokeWidth } from './markupDefaults';
import { stampCenter, stampRotation } from './markupStampGeometry';

export interface MarkupOverlayProps {
  marks: PageMarks;
  interactive?: boolean;
  className?: string;
  /** When set, overrides stroke/text colors (read-only other-user layers). */
  layerColor?: string;
  /** Layer owner's saved stamp — used to render placed stamps. */
  savedStamp?: SavedStamp | null;
  /** Ghost preview while placing a stamp (stamp tool). */
  stampPreview?: MarkupStamp | null;
}

function strokeToPolylinePoints(
  points: { x: number; y: number }[],
): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function strokeColor(stroke: MarkupStroke, layerColor?: string): string {
  return layerColor ?? stroke.color;
}

function VectorStampGraphic({
  stamp,
}: {
  stamp: Extract<SavedStamp, { kind: 'vector' }>;
}) {
  return (
    <>
      {stamp.strokes.map((stroke, index) => (
        <polyline
          key={`stamp-stroke-${index}`}
          fill="none"
          stroke={stroke.color}
          strokeWidth={renderStrokeWidth(stroke.width, 'pen')}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={strokeToPolylinePoints(stroke.points)}
        />
      ))}
    </>
  );
}

function StampPlacementGraphic({
  placement,
  savedStamp,
  opacity = 1,
}: {
  placement: MarkupStamp;
  savedStamp: SavedStamp;
  opacity?: number;
}) {
  const center = stampCenter(placement);
  const rotation = stampRotation(placement);

  const content =
    savedStamp.kind === 'image' ? (
      <image
        href={savedStamp.url}
        x={placement.x}
        y={placement.y}
        width={placement.width}
        height={placement.height}
        preserveAspectRatio="xMidYMid meet"
      />
    ) : (
      <svg
        x={placement.x}
        y={placement.y}
        width={placement.width}
        height={placement.height}
        viewBox="0 0 1 1"
        preserveAspectRatio="xMidYMid meet"
      >
        <VectorStampGraphic stamp={savedStamp} />
      </svg>
    );

  const rotated =
    rotation === 0 ? (
      content
    ) : (
      <g
        transform={`translate(${center.x} ${center.y}) rotate(${rotation}) translate(${-center.x} ${-center.y})`}
      >
        {content}
      </g>
    );

  if (opacity >= 1) return rotated;
  return <g opacity={opacity}>{rotated}</g>;
}

export default function MarkupOverlay({
  marks,
  interactive = false,
  className,
  layerColor,
  savedStamp,
  stampPreview,
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
          key={stroke.id ?? `stroke-${index}`}
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
          key={item.id ?? `text-${index}`}
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
      {marks.stamps?.map((placement) => {
        if (!savedStamp || !placement.id) return null;
        return (
          <StampPlacementGraphic
            key={`stamp-${placement.id}`}
            placement={placement}
            savedStamp={savedStamp}
          />
        );
      })}
      {stampPreview && savedStamp ? (
        <StampPlacementGraphic
          key="stamp-preview"
          placement={stampPreview}
          savedStamp={savedStamp}
          opacity={0.55}
        />
      ) : null}
    </svg>
  );
}
