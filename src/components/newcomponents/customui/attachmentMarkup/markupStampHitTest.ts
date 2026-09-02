import type { MarkupPoint, MarkupStamp } from '@/types/attachment';

import { findStampById } from './stampIds';
import {
  distanceBetween,
  pointInStampBody,
  rotateHandlePosition,
  STAMP_HANDLE_RADIUS,
  stampWorldCorners,
} from './markupStampGeometry';

export type StampCornerIndex = 0 | 1 | 2 | 3;

export type StampHit =
  | { kind: 'rotate'; id: string }
  | { kind: 'resize'; id: string; corner: StampCornerIndex }
  | { kind: 'body'; id: string };

function hitHandle(point: MarkupPoint, handle: MarkupPoint): boolean {
  return distanceBetween(point, handle) <= STAMP_HANDLE_RADIUS;
}

function hitStampHandles(
  point: MarkupPoint,
  stamp: MarkupStamp,
): StampHit | null {
  const id = stamp.id;
  if (!id) return null;

  if (hitHandle(point, rotateHandlePosition(stamp))) {
    return { kind: 'rotate', id };
  }

  const corners = stampWorldCorners(stamp);
  for (let corner = 0; corner < corners.length; corner += 1) {
    if (hitHandle(point, corners[corner]!)) {
      return { kind: 'resize', id, corner: corner as StampCornerIndex };
    }
  }

  return null;
}

export function hitTestStamps(
  point: MarkupPoint,
  stamps: MarkupStamp[],
  selectedStampId: string | null,
): StampHit | null {
  const selectedStamp = findStampById(stamps, selectedStampId);
  if (selectedStamp) {
    const handleHit = hitStampHandles(point, selectedStamp);
    if (handleHit) return handleHit;
  }

  for (let index = stamps.length - 1; index >= 0; index -= 1) {
    const stamp = stamps[index];
    if (!stamp?.id) continue;
    if (pointInStampBody(point, stamp)) {
      return { kind: 'body', id: stamp.id };
    }
  }

  return null;
}
