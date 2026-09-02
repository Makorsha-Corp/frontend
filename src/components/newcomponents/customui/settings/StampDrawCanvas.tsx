import { useCallback, useRef, useState } from 'react';

import { renderStrokeWidth } from '@/components/newcomponents/customui/attachmentMarkup/markupDefaults';
import { cn } from '@/lib/utils';
import type { MarkupPoint, MarkupStroke } from '@/types/attachment';
import { STAMP_VIEWBOX_HEIGHT, STAMP_VIEWBOX_WIDTH } from '@/types/savedStamp';

export interface StampDrawCanvasProps {
  strokes: MarkupStroke[];
  onChange: (strokes: MarkupStroke[]) => void;
  onBeforeChange?: () => void;
  color: string;
  penWidth: number;
  className?: string;
}

function clientToNormalized(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): MarkupPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
  };
}

export default function StampDrawCanvas({
  strokes,
  onChange,
  onBeforeChange,
  color,
  penWidth,
  className,
}: StampDrawCanvasProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [draftStroke, setDraftStroke] = useState<MarkupStroke | null>(null);

  const finishStroke = useCallback(
    (stroke: MarkupStroke) => {
      if (stroke.points.length < 2) {
        setDraftStroke(null);
        return;
      }
      onBeforeChange?.();
      onChange([...strokes, stroke]);
      setDraftStroke(null);
    },
    [onBeforeChange, onChange, strokes],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = clientToNormalized(event.clientX, event.clientY, rect);
    if (!point) return;
    layerRef.current?.setPointerCapture(event.pointerId);
    setDraftStroke({
      color,
      width: penWidth,
      points: [point],
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftStroke) return;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = clientToNormalized(event.clientX, event.clientY, rect);
    if (!point) return;
    setDraftStroke((current) =>
      current ? { ...current, points: [...current.points, point] } : current,
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftStroke) return;
    if (layerRef.current?.hasPointerCapture(event.pointerId)) {
      layerRef.current.releasePointerCapture(event.pointerId);
    }
    finishStroke(draftStroke);
  };

  const previewStrokes = draftStroke ? [...strokes, draftStroke] : strokes;

  return (
    <div
      ref={layerRef}
      className={cn(
        'relative w-full touch-none select-none overflow-hidden rounded-md border border-border bg-white',
        className,
      )}
      style={{ aspectRatio: `${STAMP_VIEWBOX_WIDTH} / ${STAMP_VIEWBOX_HEIGHT}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden
      >
        {previewStrokes.map((stroke, index) => (
          <polyline
            key={`stroke-${index}`}
            fill="none"
            stroke={stroke.color}
            strokeWidth={renderStrokeWidth(stroke.width, 'pen')}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
          />
        ))}
      </svg>
    </div>
  );
}
