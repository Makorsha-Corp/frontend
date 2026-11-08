import { describe, expect, it } from 'vitest';
import {
  findProductionScheduleConflicts,
  formatStageMetric,
  type ProductionScheduleWindow,
} from './productionScheduleConflict';

const base: ProductionScheduleWindow = {
  batchId: 1,
  batchNumber: 'BATCH-1',
  productionLineId: 10,
  machineId: 4,
  plannedStartAt: '2026-09-27T08:00:00',
  plannedEndAt: '2026-09-27T10:00:00',
};

describe('findProductionScheduleConflicts', () => {
  it('warns when another open window shares the line', () => {
    const other: ProductionScheduleWindow = {
      ...base,
      batchId: 2,
      batchNumber: 'BATCH-2',
      machineId: 9,
      plannedStartAt: '2026-09-27T09:00:00',
      plannedEndAt: '2026-09-27T11:00:00',
    };
    expect(findProductionScheduleConflicts(base, [other])).toEqual([
      { batchId: 2, batchNumber: 'BATCH-2', reason: 'line' },
    ]);
  });

  it('ignores a window that ends when the candidate starts', () => {
    const other: ProductionScheduleWindow = {
      ...base,
      batchId: 2,
      batchNumber: 'BATCH-2',
      plannedStartAt: '2026-09-27T06:00:00',
      plannedEndAt: '2026-09-27T08:00:00',
    };
    expect(findProductionScheduleConflicts(base, [other])).toEqual([]);
  });
});

describe('formatStageMetric', () => {
  it('renders a percent and hides missing values', () => {
    expect(formatStageMetric(85.126, 1)).toBe('85.1%');
    expect(formatStageMetric(null)).toBeNull();
  });
});
