import { useCallback, useRef } from 'react';

import { clampCorner } from '@/lib/documentScan/geometry';
import { cn } from '@/lib/utils';
import type { OrderedCorners, Point } from '@/lib/documentScan';

const HANDLE_RADIUS = 8;
const HANDLE_HIT = 18;

interface CornerOverlayProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  corners: OrderedCorners;
  onCornersChange: (corners: OrderedCorners) => void;
  disabled?: boolean;
  className?: string;
}

function toImagePoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  imageWidth: number,
  imageHeight: number,
): Point {
  const x = ((clientX - rect.left) / rect.width) * imageWidth;
  const y = ((clientY - rect.top) / rect.height) * imageHeight;
  return clampCorner({ x, y }, imageWidth, imageHeight);
}

export default function CornerOverlay({
  imageUrl,
  imageWidth,
  imageHeight,
  corners,
  onCornersChange,
  disabled = false,
  className,
}: CornerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  const toPercent = (point: Point) => ({
    left: `${(point.x / imageWidth) * 100}%`,
    top: `${(point.y / imageHeight) * 100}%`,
  });

  const updateCorner = useCallback(
    (index: number, point: Point) => {
      const next = [...corners] as OrderedCorners;
      next[index] = point;
      onCornersChange(next);
    },
    [corners, onCornersChange],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const index = dragIndexRef.current;
      const container = containerRef.current;
      if (index === null || !container || disabled) return;

      const rect = container.getBoundingClientRect();
      updateCorner(index, toImagePoint(event.clientX, event.clientY, rect, imageWidth, imageHeight));
    },
    [disabled, imageHeight, imageWidth, updateCorner],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragIndexRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const startDrag = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragIndexRef.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const [tl, tr, br, bl] = corners;

  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  return (
    <div className={cn('flex h-full w-full items-center justify-center', className)}>
      <div
        ref={containerRef}
        className="relative h-auto w-auto max-h-full max-w-full select-none bg-image-checkerboard"
        style={{ aspectRatio: `${imageWidth} / ${imageHeight}` }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={imageUrl}
          alt=""
          className="block h-full w-full"
          width={imageWidth}
          height={imageHeight}
          draggable={false}
        />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          preserveAspectRatio="none"
        >
          <polygon
            points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
            fill="rgba(124, 92, 255, 0.08)"
            stroke="rgba(124, 92, 255, 0.85)"
            strokeWidth={Math.max(imageWidth, imageHeight) * 0.0035}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {corners.map((corner, index) => {
          const position = toPercent(corner);
          return (
            <button
              key={index}
              type="button"
              aria-label={`Corner ${index + 1}`}
              disabled={disabled}
              onPointerDown={startDrag(index)}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-md disabled:cursor-not-allowed"
              style={{
                left: position.left,
                top: position.top,
                width: HANDLE_HIT,
                height: HANDLE_HIT,
              }}
            >
              <span
                className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                style={{ width: HANDLE_RADIUS, height: HANDLE_RADIUS }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
