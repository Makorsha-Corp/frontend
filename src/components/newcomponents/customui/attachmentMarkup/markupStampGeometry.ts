import type { MarkupPoint, MarkupStamp } from '@/types/attachment';

export const MIN_STAMP_WIDTH = 0.05;
export const STAMP_HANDLE_RADIUS = 0.012;
export const STAMP_ROTATE_HANDLE_OFFSET = 0.04;

export function stampRotation(stamp: MarkupStamp): number {
  return stamp.rotation ?? 0;
}

export function stampCenter(stamp: MarkupStamp): MarkupPoint {
  return {
    x: stamp.x + stamp.width / 2,
    y: stamp.y + stamp.height / 2,
  };
}

export function rotatePointAround(
  point: MarkupPoint,
  center: MarkupPoint,
  degrees: number,
): MarkupPoint {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function stampLocalCorners(stamp: MarkupStamp): MarkupPoint[] {
  return [
    { x: stamp.x, y: stamp.y },
    { x: stamp.x + stamp.width, y: stamp.y },
    { x: stamp.x + stamp.width, y: stamp.y + stamp.height },
    { x: stamp.x, y: stamp.y + stamp.height },
  ];
}

export function stampWorldCorners(stamp: MarkupStamp): MarkupPoint[] {
  const center = stampCenter(stamp);
  const rotation = stampRotation(stamp);
  return stampLocalCorners(stamp).map((corner) =>
    rotatePointAround(corner, center, rotation),
  );
}

export function rotateHandlePosition(stamp: MarkupStamp): MarkupPoint {
  const center = stampCenter(stamp);
  const rotation = stampRotation(stamp);
  const topCenter: MarkupPoint = { x: center.x, y: stamp.y };
  const rotatedTop = rotatePointAround(topCenter, center, rotation);
  const dx = rotatedTop.x - center.x;
  const dy = rotatedTop.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: rotatedTop.x + (dx / length) * STAMP_ROTATE_HANDLE_OFFSET,
    y: rotatedTop.y + (dy / length) * STAMP_ROTATE_HANDLE_OFFSET,
  };
}

export function clampStamp(stamp: MarkupStamp): MarkupStamp {
  const aspect = stamp.width > 0 ? stamp.height / stamp.width : 1;
  const width = Math.max(MIN_STAMP_WIDTH, Math.min(1, stamp.width));
  const height = width * aspect;
  const x = Math.max(0, Math.min(1 - width, stamp.x));
  const y = Math.max(0, Math.min(1 - height, stamp.y));
  return { ...stamp, x, y, width, height };
}

export function pointInStampBody(point: MarkupPoint, stamp: MarkupStamp): boolean {
  const center = stampCenter(stamp);
  const local = rotatePointAround(point, center, -stampRotation(stamp));
  return (
    local.x >= stamp.x &&
    local.x <= stamp.x + stamp.width &&
    local.y >= stamp.y &&
    local.y <= stamp.y + stamp.height
  );
}

export function distanceBetween(a: MarkupPoint, b: MarkupPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
