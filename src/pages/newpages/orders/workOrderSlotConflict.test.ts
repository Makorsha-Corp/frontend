import { describe, expect, it } from 'vitest';
import { findOpenWorkOrderSlotConflict } from './workOrderSlotConflict';

const baseOrder = {
  id: 1,
  machine_id: 5,
  work_order_type_id: 10,
  planned_date: '2026-07-26',
  work_order_number: 'WO-2026-001',
  work_order_type_name: 'Maintenance',
  title: 'Maintenance — Loom 1',
  created_at: '2026-07-20T10:00:00Z',
};

describe('findOpenWorkOrderSlotConflict', () => {
  it('returns conflict for matching draft', () => {
    const result = findOpenWorkOrderSlotConflict({
      orders: [{ ...baseOrder, status: 'DRAFT' }],
      machineId: 5,
      workOrderTypeId: 10,
      plannedDate: '2026-07-26',
    });
    expect(result?.workOrderNumber).toBe('WO-2026-001');
  });

  it('returns conflict for in-progress', () => {
    const result = findOpenWorkOrderSlotConflict({
      orders: [{ ...baseOrder, id: 2, status: 'IN_PROGRESS' }],
      machineId: 5,
      workOrderTypeId: 10,
      plannedDate: '2026-07-26',
    });
    expect(result?.status).toBe('IN_PROGRESS');
  });

  it('ignores completed', () => {
    const result = findOpenWorkOrderSlotConflict({
      orders: [{ ...baseOrder, status: 'COMPLETED' }],
      machineId: 5,
      workOrderTypeId: 10,
      plannedDate: '2026-07-26',
    });
    expect(result).toBeNull();
  });

  it('excludes self in edit mode', () => {
    const result = findOpenWorkOrderSlotConflict({
      orders: [{ ...baseOrder, status: 'DRAFT' }],
      machineId: 5,
      workOrderTypeId: 10,
      plannedDate: '2026-07-26',
      excludeWorkOrderId: 1,
    });
    expect(result).toBeNull();
  });
});
