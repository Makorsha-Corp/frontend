import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';
import type { MarkupPoint, MarkupStroke, PageMarks } from '@/types/attachment';

import { renderStrokeWidth } from './markupDefaults';
import {
  LOUPE_DRAW_ZOOM,
  LOUPE_RECT_HEIGHT,
  LOUPE_RECT_WIDTH,
  loupeLocalToNormalized,
  loupeSourceRect,
  type ImagePixelPoint,
} from './markupLoupeCoords';
import { computeRectLoupePosition } from './markupLoupePlacement';
import { markupCopy } from './markupCopy';

function strokeToPolylinePoints(points: MarkupPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export interface MarkupDrawLoupeProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  center: ImagePixelPoint;
  marks: PageMarks;
  penColor: string;
  penWidth: number;
  pointerClientX: number;
  pointerClientY: number;
  /** Fixed container-local position when placed; overrides pointer placement. */
  placement?: { left: number; top: number } | null;
  portalContainer: HTMLElement | null;
  locked: boolean;
  lockedCenter: ImagePixelPoint;
  onDrawingChange?: (drawing: boolean) => void;
  onStrokeComplete: (stroke: MarkupStroke) => void;
  onBeforeStroke?: () => void;
}

export default function MarkupDrawLoupe({
  imageUrl,
  imageWidth,
  imageHeight,
  center,
  marks,
  penColor,
  penWidth,
  pointerClientX,
  pointerClientY,
  placement = null,
  portalContainer,
  locked,
  lockedCenter,
  onDrawingChange,
  onStrokeComplete,
  onBeforeStroke,
}: MarkupDrawLoupeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [draftStroke, setDraftStroke] = useState<MarkupStroke | null>(null);

  const drawCenter = locked ? lockedCenter : center;
  const sourceRect = loupeSourceRect(drawCenter, imageWidth, imageHeight);
  const viewBox = `${sourceRect.sx / imageWidth} ${sourceRect.sy / imageHeight} ${sourceRect.sw / imageWidth} ${sourceRect.sh / imageHeight}`;

  const containerRect = portalContainer?.getBoundingClientRect();
  const computedPlacement = containerRect
    ? computeRectLoupePosition({
        pointerClientX,
        pointerClientY,
        containerRect: {
          left: containerRect.left,
          top: containerRect.top,
          width: containerRect.width,
          height: containerRect.height,
        },
      })
    : { left: 0, top: 0 };
  const loupeLeft = placement?.left ?? computedPlacement.left;
  const loupeTop = placement?.top ?? computedPlacement.top;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      paintCanvas();
    };
    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete || imageWidth <= 0 || imageHeight <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOUPE_RECT_WIDTH * dpr;
    canvas.height = LOUPE_RECT_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LOUPE_RECT_WIDTH, LOUPE_RECT_HEIGHT);

    const { sx, sy, sw, sh } = loupeSourceRect(drawCenter, imageWidth, imageHeight);
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, LOUPE_RECT_WIDTH, LOUPE_RECT_HEIGHT);

    const centerX = LOUPE_RECT_WIDTH / 2;
    const centerY = LOUPE_RECT_HEIGHT / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(LOUPE_RECT_WIDTH, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, LOUPE_RECT_HEIGHT);
    ctx.stroke();
    ctx.restore();
  }, [drawCenter, imageHeight, imageWidth]);

  useEffect(() => {
    paintCanvas();
  }, [paintCanvas, drawCenter.x, drawCenter.y]);

  const mapLoupePoint = useCallback(
    (clientX: number, clientY: number): MarkupPoint | null => {
      const layer = layerRef.current;
      if (!layer) return null;
      const rect = layer.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        return null;
      }
      return loupeLocalToNormalized(
        localX,
        localY,
        drawCenter,
        imageWidth,
        imageHeight,
      );
    },
    [drawCenter, imageHeight, imageWidth],
  );

  const finishStroke = useCallback(
    (stroke: MarkupStroke) => {
      if (stroke.points.length < 2) {
        setDraftStroke(null);
        onDrawingChange?.(false);
        return;
      }
      onBeforeStroke?.();
      onStrokeComplete(stroke);
      setDraftStroke(null);
      onDrawingChange?.(false);
    },
    [onBeforeStroke, onDrawingChange, onStrokeComplete],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const point = mapLoupePoint(event.clientX, event.clientY);
    if (!point) return;
    layerRef.current?.setPointerCapture(event.pointerId);
    onDrawingChange?.(true);
    setDraftStroke({
      color: penColor,
      width: penWidth,
      points: [point],
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftStroke) return;
    const point = mapLoupePoint(event.clientX, event.clientY);
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

  const previewMarks: PageMarks = draftStroke
    ? { ...marks, strokes: [...marks.strokes, draftStroke] }
    : marks;

  if (!portalContainer || !containerRect || !placement) {
    return null;
  }

  const loupePanel = (
    <div
      className="absolute z-[60] overflow-hidden rounded-md border-2 border-primary bg-background shadow-lg"
      style={{
        left: loupeLeft,
        top: loupeTop,
        width: LOUPE_RECT_WIDTH,
        height: LOUPE_RECT_HEIGHT,
      }}
      aria-label={markupCopy.loupeLabel}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={viewBox}
        preserveAspectRatio="none"
        aria-hidden
      >
        {previewMarks.strokes.map((stroke, index) => (
          <polyline
            key={`loupe-stroke-${index}`}
            fill="none"
            stroke={stroke.color}
            strokeWidth={renderStrokeWidth(stroke.width, 'pen')}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={strokeToPolylinePoints(stroke.points)}
          />
        ))}
      </svg>
      <div
        ref={layerRef}
        className={cn('absolute inset-0 touch-none', draftStroke ? 'cursor-crosshair' : 'cursor-crosshair')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );

  return createPortal(loupePanel, portalContainer);
}

export { LOUPE_DRAW_ZOOM, LOUPE_RECT_HEIGHT, LOUPE_RECT_WIDTH };
