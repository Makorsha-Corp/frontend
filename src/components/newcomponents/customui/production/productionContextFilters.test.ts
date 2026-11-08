import { describe, expect, it } from 'vitest';
import {
  batchMatchesDateRange,
  batchStatusCheckboxChecked,
  batchStatusFilterRowHint,
  DEFAULT_BATCH_STATUS_FILTER,
  DEFAULT_WEEK_BATCH_STATUS_FILTER,
  filterBatchesByStatusForList,
  isDayDefaultBatchStatusFilter,
  isFollowViewBatchStatusDefault,
  isWeekDefaultBatchStatusFilter,
  normalizeBatchStatusFilter,
  resolveEffectiveBatchStatusFilter,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { persistedBatchStatusFilter } from '@/pages/newpages/production/productionBatchStatusDefaults';

const rows = [
  { id: 1, status: 'draft' },
  { id: 2, status: 'in_progress' },
  { id: 3, status: 'completed' },
  { id: 4, status: 'cancelled' },
  { id: 5, status: 'recurring' },
];

describe('filterBatchesByStatusForList', () => {
  const effective = normalizeBatchStatusFilter([...DEFAULT_BATCH_STATUS_FILTER]);

  it('hides completed when Show completed is off (default status filter)', () => {
    const out = filterBatchesByStatusForList(rows, false, effective);
    expect(out.map((r) => r.status)).toEqual(['draft', 'in_progress']);
  });

  it('includes completed when Show completed is on', () => {
    const out = filterBatchesByStatusForList(rows, true, effective);
    expect(out.map((r) => r.status)).toEqual(['draft', 'in_progress', 'completed']);
  });

  it('respects cancelled in status popover when Show completed is on', () => {
    const withCancelled = normalizeBatchStatusFilter(['draft', 'in_progress', 'cancelled']);
    const out = filterBatchesByStatusForList(rows, true, withCancelled);
    expect(out.map((r) => r.status)).toEqual(['draft', 'in_progress', 'completed', 'cancelled']);
  });
});

describe('view status defaults', () => {
  it('follows the view when nothing is stored', () => {
    expect(isFollowViewBatchStatusDefault([])).toBe(true);
    expect(resolveEffectiveBatchStatusFilter([], 'all')).toEqual([...DEFAULT_BATCH_STATUS_FILTER]);
    expect(resolveEffectiveBatchStatusFilter([], 'week')).toEqual([...DEFAULT_WEEK_BATCH_STATUS_FILTER]);
    expect(resolveEffectiveBatchStatusFilter([], 'day')).toEqual([...DEFAULT_WEEK_BATCH_STATUS_FILTER]);
    expect(batchStatusCheckboxChecked([], 'recurring', 'week')).toBe(true);
    expect(batchStatusCheckboxChecked([], 'recurring', 'day')).toBe(true);
    expect(batchStatusCheckboxChecked([], 'recurring', 'all')).toBe(false);
  });

  it('keeps a custom mix on every view', () => {
    const custom = ['draft', 'in_progress'] as const;
    expect(isDayDefaultBatchStatusFilter([...custom])).toBe(true);
    expect(isWeekDefaultBatchStatusFilter([...custom])).toBe(false);
    expect(resolveEffectiveBatchStatusFilter([...custom], 'week')).toEqual([...custom]);
    expect(batchStatusCheckboxChecked([...custom], 'recurring', 'week')).toBe(false);
  });

  it('explains planned defaults per date view on hover', () => {
    expect(batchStatusFilterRowHint('recurring', 'week')).toMatch(/week/i);
    expect(batchStatusFilterRowHint('recurring', 'all')).toMatch(/off on All dates/i);
    expect(batchStatusFilterRowHint('draft', 'week')).toBeUndefined();
  });

  it('stores [] when the selection matches the open view default', () => {
    expect(persistedBatchStatusFilter([...DEFAULT_WEEK_BATCH_STATUS_FILTER], 'week')).toEqual([]);
    expect(persistedBatchStatusFilter([...DEFAULT_WEEK_BATCH_STATUS_FILTER], 'day')).toEqual([]);
    expect(persistedBatchStatusFilter([...DEFAULT_BATCH_STATUS_FILTER], 'all')).toEqual([]);
    expect(persistedBatchStatusFilter([...DEFAULT_WEEK_BATCH_STATUS_FILTER], 'all')).toEqual([
      ...DEFAULT_WEEK_BATCH_STATUS_FILTER,
    ]);
    expect(persistedBatchStatusFilter(['draft', 'in_progress'], 'week')).toEqual([
      'draft',
      'in_progress',
    ]);
  });
});

describe('batchMatchesDateRange', () => {
  it('passes when no range set', () => {
    expect(batchMatchesDateRange({ batch_date: '2026-01-15' }, null, null)).toBe(true);
  });

  it('filters by batch_date inclusive', () => {
    const batch = { batch_date: '2026-01-15' };
    expect(batchMatchesDateRange(batch, '2026-01-01', '2026-01-31')).toBe(true);
    expect(batchMatchesDateRange(batch, '2026-02-01', null)).toBe(false);
  });
});
