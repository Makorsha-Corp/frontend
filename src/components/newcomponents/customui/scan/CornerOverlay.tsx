import { useCallback, useRef, useState } from 'react';

import { clientToImagePoint } from '@/lib/documentScan/viewportCoords';
import { cn } from '@/lib/utils';
import type { OrderedCorners, Point } from '@/lib/documentScan';

import CornerLoupe from './CornerLoupe';
import { useImageViewport } from './useImageViewport';

const HANDLE_RADIUS = 8;
const HANDLE_HIT = 44;

interface CornerOverlayProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  corners: OrderedCorners;
  onCornersChange: (corners: OrderedCorners) => void;
  disabled?: boolean;
  className?: string;
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
  const imageRef = useRef<HTMLImageElement>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);

  const {
    viewportRef,
    layout,
    viewport,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
    onViewportWheel,
    resetViewport,
  } = useImageViewport({
    imageWidth,
    imageHeight,
    disabled,
  });

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

  const mapPointerToImage = useCallback(
    (clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return clientToImagePoint(
        clientX,
        clientY,
        rect,
        layout,
        imageWidth,
        imageHeight,
        viewport,
      );
    },
    [imageHeight, imageWidth, layout, viewport, viewportRef],
  );

  const onHandlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (activeDragIndex === null || disabled) return;

      const localRect = viewportRef.current?.getBoundingClientRect();
      if (localRect) {
        setDragPointer({
          x: event.clientX - localRect.left,
          y: event.clientY - localRect.top,
        });
      }

      const point = mapPointerToImage(event.clientX, event.clientY);
      if (point) updateCorner(activeDragIndex, point);
    },
    [activeDragIndex, disabled, mapPointerToImage, updateCorner, viewportRef],
  );

  const endHandleDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    setActiveDragIndex(null);
    setDragPointer(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const startHandleDrag = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveDragIndex(index);

    const localRect = viewportRef.current?.getBoundingClientRect();
    if (localRect) {
      setDragPointer({
        x: event.clientX - localRect.left,
        y: event.clientY - localRect.top,
      });
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const [tl, tr, br, bl] = corners;
  const handleInverseScale = viewport.scale > 0 ? 1 / viewport.scale : 1;
  const showLoupe = activeDragIndex !== null && dragPointer !== null;
  const layoutReady = layout.displayWidth > 0 && layout.displayHeight > 0;

  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  return (
    <div className={cn('relative h-full min-h-0 w-full self-stretch', className)}>
      <div
        ref={viewportRef}
        className="relative h-full min-h-[12rem] w-full touch-none overflow-hidden rounded-md bg-image-checkerboard"
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={onViewportPointerUp}
        onPointerCancel={onViewportPointerUp}
        onWheel={onViewportWheel}
      >
        {layoutReady ? (
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: layout.displayWidth,
            height: layout.displayHeight,
            transform: `translate(${layout.offsetX + viewport.panX}px, ${layout.offsetY + viewport.panY}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt=""
            className="block h-full w-full select-none"
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
                onPointerDown={startHandleDrag(index)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={endHandleDrag}
                onPointerCancel={endHandleDrag}
                className="absolute z-10 flex items-center justify-center rounded-full border-2 border-white bg-primary shadow-md disabled:cursor-not-allowed"
                style={{
                  left: position.left,
                  top: position.top,
                  width: HANDLE_HIT,
                  height: HANDLE_HIT,
                  transform: `translate(-50%, -50%) scale(${handleInverseScale})`,
                }}
              >
                <span
                  className="block rounded-full bg-primary"
                  style={{ width: HANDLE_RADIUS * 2, height: HANDLE_RADIUS * 2 }}
                />
              </button>
            );
          })}
        </div>
        ) : null}

        {showLoupe && dragPointer && activeDragIndex !== null ? (
          <CornerLoupe
            image={imageRef.current}
            corners={corners}
            activeCornerIndex={activeDragIndex}
            pointerX={dragPointer.x}
            pointerY={dragPointer.y}
            viewportWidth={viewportRef.current?.clientWidth ?? 0}
            viewportHeight={viewportRef.current?.clientHeight ?? 0}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        ) : null}
      </div>

      {viewport.scale > 1 ? (
        <button
          type="button"
          className="absolute bottom-2 right-2 z-20 rounded-md border border-border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm"
          onClick={resetViewport}
          disabled={disabled}
        >
          Fit
        </button>
      ) : null}
    </div>
  );
}
