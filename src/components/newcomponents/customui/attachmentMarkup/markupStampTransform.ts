import type { MarkupPoint, MarkupStamp } from '@/types/attachment';

import {
  clampStamp,
  MIN_STAMP_WIDTH,
  stampCenter,
  stampWorldCorners,
} from './markupStampGeometry';
import type { StampCornerIndex } from './markupStampHitTest';

export function applyMoveDrag(
  startStamp: MarkupStamp,
  startPoint: MarkupPoint,
  currentPoint: MarkupPoint,
): MarkupStamp {
  return clampStamp({
    ...startStamp,
    x: startStamp.x + (currentPoint.x - startPoint.x),
    y: startStamp.y + (currentPoint.y - startPoint.y),
  });
}

export function applyUniformResize(
  stamp: MarkupStamp,
  corner: StampCornerIndex,
  pointer: MarkupPoint,
): MarkupStamp {
  const center = stampCenter(stamp);
  const corners = stampWorldCorners(stamp);
  const draggedCorner = corners[corner];
  if (!draggedCorner) return stamp;

  const oldDistance = Math.hypot(draggedCorner.x - center.x, draggedCorner.y - center.y);
  const newDistance = Math.hypot(pointer.x - center.x, pointer.y - center.y);
  if (oldDistance <= 0) return stamp;

  const aspect = stamp.width > 0 ? stamp.height / stamp.width : 1;
  const scale = newDistance / oldDistance;
  const width = Math.max(MIN_STAMP_WIDTH, stamp.width * scale);
  const height = width * aspect;

  return clampStamp({
    ...stamp,
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  });
}

export function applyRotateDrag(
  startStamp: MarkupStamp,
  startPointer: MarkupPoint,
  currentPointer: MarkupPoint,
): MarkupStamp {
  const center = stampCenter(startStamp);
  const startAngle = Math.atan2(startPointer.y - center.y, startPointer.x - center.x);
  const currentAngle = Math.atan2(currentPointer.y - center.y, currentPointer.x - center.x);
  const deltaDegrees = ((currentAngle - startAngle) * 180) / Math.PI;
  let rotation = (startStamp.rotation ?? 0) + deltaDegrees;

  if (rotation > 360) rotation = 360;
  if (rotation < -360) rotation = -360;

  return { ...startStamp, rotation };
}

export function updateStampById(
  stamps: MarkupStamp[],
  id: string,
  stamp: MarkupStamp,
): MarkupStamp[] {
  return stamps.map((current) => (current.id === id ? stamp : current));
}

export function removeStampById(stamps: MarkupStamp[], id: string): MarkupStamp[] {
  return stamps.filter((current) => current.id !== id);
}
