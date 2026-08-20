import { FINGER_GAP, LOUPE_VIEWPORT_PADDING } from '@/components/newcomponents/customui/scan/loupePlacement';

import { LOUPE_RECT_HEIGHT, LOUPE_RECT_WIDTH } from './markupLoupeCoords';

export interface LoupeContainerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RectLoupePlacementInput {
  pointerClientX: number;
  pointerClientY: number;
  containerRect: LoupeContainerRect;
  loupeWidth?: number;
  loupeHeight?: number;
}

export interface RectLoupePlacement {
  left: number;
  top: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Place rectangular loupe above pointer, clamped inside container. */
export function computeRectLoupePosition(input: RectLoupePlacementInput): RectLoupePlacement {
  const {
    pointerClientX,
    pointerClientY,
    containerRect,
    loupeWidth = LOUPE_RECT_WIDTH,
    loupeHeight = LOUPE_RECT_HEIGHT,
  } = input;
  const pad = LOUPE_VIEWPORT_PADDING;
  const minLeft = pad;
  const maxLeft = Math.max(minLeft, containerRect.width - loupeWidth - pad);
  const minTop = pad;
  const maxTop = Math.max(minTop, containerRect.height - loupeHeight - pad);

  const left = clamp(
    pointerClientX - containerRect.left - loupeWidth / 2,
    minLeft,
    maxLeft,
  );

  const top = clamp(
    pointerClientY - containerRect.top - loupeHeight - FINGER_GAP,
    minTop,
    maxTop,
  );

  return { left, top };
}
