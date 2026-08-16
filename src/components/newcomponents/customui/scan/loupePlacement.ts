export const LOUPE_SIZE = 120;
export const FINGER_GAP = 48;
export const LOUPE_VIEWPORT_PADDING = 8;

export interface LoupeContainerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LoupePlacementInput {
  pointerClientX: number;
  pointerClientY: number;
  containerRect: LoupeContainerRect;
}

export interface LoupePlacement {
  left: number;
  top: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Always place magnifier above touch, in container-local coordinates (dialog portal). */
export function computeLoupePositionInContainer(input: LoupePlacementInput): LoupePlacement {
  const { pointerClientX, pointerClientY, containerRect } = input;
  const pad = LOUPE_VIEWPORT_PADDING;
  const minLeft = pad;
  const maxLeft = Math.max(minLeft, containerRect.width - LOUPE_SIZE - pad);
  const minTop = pad;
  const maxTop = Math.max(minTop, containerRect.height - LOUPE_SIZE - pad);

  const left = clamp(
    pointerClientX - containerRect.left - LOUPE_SIZE / 2,
    minLeft,
    maxLeft,
  );

  const top = clamp(
    pointerClientY - containerRect.top - LOUPE_SIZE - FINGER_GAP,
    minTop,
    maxTop,
  );

  return { left, top };
}
