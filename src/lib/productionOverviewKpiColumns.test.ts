import { describe, expect, it } from 'vitest';

import {
  defaultOverviewKpiColumnIds,
  sanitizeOverviewKpiColumnIds,
  toggleOverviewKpiColumn,
} from '@/lib/productionOverviewKpiColumns';

describe('productionOverviewKpiColumns', () => {
  it('defaults include batches and output', () => {
    const ids = defaultOverviewKpiColumnIds();
    expect(ids).toContain('batch_count');
    expect(ids).toContain('output_quantity');
    expect(ids).not.toContain('waste_quantity');
  });

  it('sanitize drops unknown and refuses empty', () => {
    expect(sanitizeOverviewKpiColumnIds(['yield_pct', 'nope'])).toEqual(['yield_pct']);
    expect(sanitizeOverviewKpiColumnIds([])).toEqual(defaultOverviewKpiColumnIds());
  });

  it('toggle keeps at least one column', () => {
    const only = ['yield_pct'] as const;
    expect(toggleOverviewKpiColumn([...only], 'yield_pct')).toEqual(['yield_pct']);
  });
});
