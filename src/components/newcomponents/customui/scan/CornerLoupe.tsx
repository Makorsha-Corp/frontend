import { useEffect, useRef } from 'react';

import type { OrderedCorners } from '@/lib/documentScan';

const LOUPE_SIZE = 120;
const LOUPE_ZOOM = 2.5;
const LOUPE_OFFSET_Y = 28;

function imagePointToLoupe(
  point: { x: number; y: number },
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): { x: number; y: number } {
  return {
    x: sw > 0 ? ((point.x - sx) / sw) * LOUPE_SIZE : LOUPE_SIZE / 2,
    y: sh > 0 ? ((point.y - sy) / sh) * LOUPE_SIZE : LOUPE_SIZE / 2,
  };
}

/** Full-width horizontal + vertical reticle through loupe center. */
function drawFullDiameterCrosshair(ctx: CanvasRenderingContext2D) {
  const center = LOUPE_SIZE / 2;

  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, center);
  ctx.lineTo(LOUPE_SIZE, center);
  ctx.moveTo(center, 0);
  ctx.lineTo(center, LOUPE_SIZE);
  ctx.stroke();
  ctx.restore();
}

export interface CornerLoupeProps {
  image: HTMLImageElement | null;
  corners: OrderedCorners;
  activeCornerIndex: number;
  pointerX: number;
  pointerY: number;
  viewportWidth: number;
  viewportHeight: number;
  imageWidth: number;
  imageHeight: number;
}

export default function CornerLoupe({
  image,
  corners,
  activeCornerIndex,
  pointerX,
  pointerY,
  viewportWidth,
  viewportHeight,
  imageWidth,
  imageHeight,
}: CornerLoupeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loupeLeft = Math.min(
    Math.max(pointerX - LOUPE_SIZE / 2, 8),
    viewportWidth - LOUPE_SIZE - 8,
  );
  const loupeTop = Math.min(
    Math.max(pointerY - LOUPE_SIZE - LOUPE_OFFSET_Y, 8),
    viewportHeight - LOUPE_SIZE - 8,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !image.complete || imageWidth <= 0 || imageHeight <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOUPE_SIZE * dpr;
    canvas.height = LOUPE_SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);

    ctx.save();
    ctx.beginPath();
    ctx.arc(LOUPE_SIZE / 2, LOUPE_SIZE / 2, LOUPE_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.clip();

    const activeCorner = corners[activeCornerIndex];
    const sourceRadius = LOUPE_SIZE / (2 * LOUPE_ZOOM);
    const sx = Math.max(0, Math.min(imageWidth - sourceRadius * 2, activeCorner.x - sourceRadius));
    const sy = Math.max(0, Math.min(imageHeight - sourceRadius * 2, activeCorner.y - sourceRadius));
    const sw = Math.min(sourceRadius * 2, imageWidth - sx);
    const sh = Math.min(sourceRadius * 2, imageHeight - sy);

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, LOUPE_SIZE, LOUPE_SIZE);

    ctx.strokeStyle = 'rgba(124, 92, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    corners.forEach((corner, index) => {
      const { x: lx, y: ly } = imagePointToLoupe(corner, sx, sy, sw, sh);
      if (index === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    drawFullDiameterCrosshair(ctx);

    ctx.strokeStyle = 'rgba(124, 92, 255, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(LOUPE_SIZE / 2, LOUPE_SIZE / 2, LOUPE_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [activeCornerIndex, corners, image, imageHeight, imageWidth]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute z-20 rounded-full border-2 border-primary shadow-lg"
      style={{
        left: loupeLeft,
        top: loupeTop,
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
      }}
    />
  );
}

export { LOUPE_SIZE };
