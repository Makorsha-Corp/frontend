import { describe, expect, it } from 'vitest';

import type { AttachmentMarkupLayer } from '@/types/attachment';

import {
  areAllLayersVisible,
  buildMineOnlyVisibility,
  buildShowAllVisibility,
  isMineOnlyView,
} from './layerVisibilityState';

function layer(
  overrides: Partial<AttachmentMarkupLayer> & Pick<AttachmentMarkupLayer, 'user_id'>,
): AttachmentMarkupLayer {
  return {
    payload: { pages: {} },
    updated_at: '2026-01-01T12:00:00Z',
    user_name: 'Jane',
    is_mine: false,
    saved_stamp: null,
    ...overrides,
  };
}

describe('layerVisibilityState', () => {
  const layers = [
    layer({ user_id: 1, is_mine: true, user_name: 'You' }),
    layer({ user_id: 2, user_name: 'Jane' }),
  ];

  it('detects mine-only and all-visible views', () => {
    const mineOnly = buildMineOnlyVisibility(layers);
    const showAll = buildShowAllVisibility(layers);

    expect(isMineOnlyView(layers, mineOnly)).toBe(true);
    expect(areAllLayersVisible(layers, showAll)).toBe(true);
    expect(isMineOnlyView(layers, showAll)).toBe(false);
  });
});
