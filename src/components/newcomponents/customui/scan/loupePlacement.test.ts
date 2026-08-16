import { describe, expect, it } from 'vitest';

import {
  computeLoupePositionInContainer,
  FINGER_GAP,
  LOUPE_SIZE,
  LOUPE_VIEWPORT_PADDING,
} from './loupePlacement';

const DIALOG_LEFT = 8;
const DIALOG_TOP = 54;
const DIALOG_W = 400;
const DIALOG_H = 797;

function dialogRect() {
  return { left: DIALOG_LEFT, top: DIALOG_TOP, width: DIALOG_W, height: DIALOG_H };
}

/** Preview box starts ~105px below dialog top on phone layout. */
const PREVIEW_OFFSET_Y = 105;

describe('computeLoupePositionInContainer', () => {
  it('always places loupe above finger in container-local coords', () => {
    const pointerClientY = DIALOG_TOP + 350;
    const { top } = computeLoupePositionInContainer({
      pointerClientX: DIALOG_LEFT + 200,
      pointerClientY,
      containerRect: dialogRect(),
    });

    const pointerLocalY = pointerClientY - DIALOG_TOP;
    expect(top + LOUPE_SIZE).toBeLessThanOrEqual(pointerLocalY - FINGER_GAP + LOUPE_SIZE);
    expect(top).toBe(pointerLocalY - LOUPE_SIZE - FINGER_GAP);
  });

  it('escapes into dialog header when touch is near top of preview', () => {
    const pointerClientY = DIALOG_TOP + PREVIEW_OFFSET_Y + 60;
    const { top } = computeLoupePositionInContainer({
      pointerClientX: DIALOG_LEFT + 180,
      pointerClientY,
      containerRect: dialogRect(),
    });

    expect(top).toBe(LOUPE_VIEWPORT_PADDING);
    expect(top).toBeLessThan(PREVIEW_OFFSET_Y);
  });

  it('places loupe above finger for bottom-corner drag', () => {
    const pointerClientY = DIALOG_TOP + 650;
    const { top } = computeLoupePositionInContainer({
      pointerClientX: DIALOG_LEFT + 200,
      pointerClientY,
      containerRect: dialogRect(),
    });

    expect(top).toBe(pointerClientY - DIALOG_TOP - LOUPE_SIZE - FINGER_GAP);
    expect(top + LOUPE_SIZE).toBeLessThan(pointerClientY - DIALOG_TOP);
  });

  it('clamps horizontal position to container padding', () => {
    const { left } = computeLoupePositionInContainer({
      pointerClientX: DIALOG_LEFT + 10,
      pointerClientY: DIALOG_TOP + 300,
      containerRect: dialogRect(),
    });

    expect(left).toBe(LOUPE_VIEWPORT_PADDING);
  });

  it('clamps vertical position to container top when ideal is above dialog', () => {
    const pointerClientY = DIALOG_TOP + 20;
    const { top } = computeLoupePositionInContainer({
      pointerClientX: DIALOG_LEFT + 200,
      pointerClientY,
      containerRect: dialogRect(),
    });

    expect(top).toBe(LOUPE_VIEWPORT_PADDING);
  });
});
