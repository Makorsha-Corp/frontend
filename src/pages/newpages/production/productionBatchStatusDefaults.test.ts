import { describe, expect, it } from 'vitest';
import { DEFAULT_WEEK_BATCH_STATUS_FILTER } from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { persistedBatchStatusFilter } from '@/pages/newpages/production/productionBatchStatusDefaults';

describe('persistedBatchStatusFilter', () => {
  it('does not rewrite the date view when the filter is still the view default', () => {
    expect(persistedBatchStatusFilter([...DEFAULT_WEEK_BATCH_STATUS_FILTER], 'week')).toEqual([]);
    expect(persistedBatchStatusFilter(['draft', 'cancelled'], 'all')).toEqual(['draft', 'cancelled']);
  });
});
