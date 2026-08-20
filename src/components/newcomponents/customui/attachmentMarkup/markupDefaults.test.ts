import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PEN_PRESET,
  PEN_RENDER_FLOOR,
  PEN_WIDTH,
  PEN_WIDTH_PRESETS,
  SCRIBBLE_RENDER_FLOOR,
  layerColorForUser,
  renderStrokeWidth,
} from './markupDefaults';

describe('markupDefaults', () => {
  it('uses pen preset widths with medium default', () => {
    expect(PEN_WIDTH).toBe(PEN_WIDTH_PRESETS.m.width);
    expect(DEFAULT_PEN_PRESET).toBe('m');
    expect(PEN_WIDTH_PRESETS.s.width).toBe(0.012);
    expect(PEN_WIDTH_PRESETS.l.width).toBe(0.028);
  });

  it('raises legacy thin strokes to render floor', () => {
    expect(renderStrokeWidth(0.008, 'pen')).toBe(PEN_RENDER_FLOOR);
    expect(renderStrokeWidth(0.02, 'pen')).toBe(0.02);
    expect(renderStrokeWidth(0.02, 'scribble')).toBe(SCRIBBLE_RENDER_FLOOR);
    expect(renderStrokeWidth(0.06, 'scribble')).toBe(0.06);
  });

  it('assigns stable color per user id', () => {
    expect(layerColorForUser(5)).toBe(layerColorForUser(5));
    expect(layerColorForUser(5)).not.toBe(layerColorForUser(6));
  });
});
