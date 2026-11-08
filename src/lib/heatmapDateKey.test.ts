import { describe, expect, it } from 'vitest';

import { toLocalDateKey } from '@/lib/heatmapDateKey';

describe('toLocalDateKey', () => {
  it('keeps YYYY-MM-DD on that calendar day', () => {
    expect(toLocalDateKey('2026-10-05')).toBe('2026-10-05');
  });

  it('uses local calendar for Date instances', () => {
    const d = new Date(2026, 9, 5, 23, 30);
    expect(toLocalDateKey(d)).toBe('2026-10-05');
  });
});
