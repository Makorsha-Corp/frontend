import { describe, expect, it } from 'vitest';

import {
  collapseSheetRowsToDayCards,
  getSheetDateStatusSublabel,
  type WorkOrderSheetRow,
} from './workOrderSheetData';

function sheetRow(partial: Partial<WorkOrderSheetRow> & Pick<WorkOrderSheetRow, 'workOrderId' | 'works'>): WorkOrderSheetRow {
  return {
    key: `${partial.workOrderId}-${partial.itemId ?? 0}`,
    workOrderNumber: partial.workOrderNumber ?? 'WO-1',
    status: partial.status ?? 'DRAFT',
    approvalMet: true,
    itemId: partial.itemId ?? 1,
    date: partial.date ?? '2026-03-01',
    plannedDate: null,
    machineId: 1,
    machineName: partial.machineName ?? 'Loom 1',
    factoryName: 'F1',
    sectionName: null,
    partName: 'Part',
    actionType: null,
    startedAt: null,
    completedAt: null,
    updatedAt: null,
    quantity: null,
    unit: 'pcs',
    workers: '',
    assigneeUserIds: [],
    managerStatus: '—',
    agmStatus: '—',
    approvers: [],
    remarks: '',
    priority: 'MEDIUM',
    hasBilling: false,
    hasTemplate: false,
    isRecurringFromTemplate: false,
    recurrenceCadence: null,
    templateName: null,
    billingHint: null,
    rowTitle: partial.rowTitle ?? null,
    isFirstInGroup: partial.isFirstInGroup ?? true,
    groupRowSpan: partial.groupRowSpan ?? 1,
    ...partial,
  };
}

describe('collapseSheetRowsToDayCards', () => {
  it('collapses multiple lines of one order into one card with lineCount', () => {
    const rows = [
      sheetRow({ workOrderId: 10, works: 'Oil change', itemId: 1, isFirstInGroup: true, groupRowSpan: 2 }),
      sheetRow({ workOrderId: 10, works: 'Filter', itemId: 2, isFirstInGroup: false, groupRowSpan: 2 }),
    ];
    const cards = collapseSheetRowsToDayCards(rows);
    expect(cards).toHaveLength(1);
    expect(cards[0].lineCount).toBe(2);
    expect(cards[0].title).toBe('Oil change');
    expect(cards[0].secondaryLine).toBe('2 lines');
  });

  it('keeps first-seen order and leaves a second order as a second card', () => {
    const rows = [
      sheetRow({ workOrderId: 1, works: 'First', itemId: 1 }),
      sheetRow({ workOrderId: 2, works: 'Second', itemId: 2, machineName: 'Loom 2', workOrderNumber: 'WO-2' }),
    ];
    const cards = collapseSheetRowsToDayCards(rows);
    expect(cards.map((c) => c.workOrderId)).toEqual([1, 2]);
    expect(cards[1].secondaryLine).toBe('Loom 2 · WO-2');
  });

  it('uses rowTitle when present', () => {
    const cards = collapseSheetRowsToDayCards([
      sheetRow({ workOrderId: 5, works: 'ignored', rowTitle: '  Custom title  ' }),
    ]);
    expect(cards[0].title).toBe('Custom title');
  });
});

describe('getSheetDateStatusSublabel', () => {
  it('shows Complete for completed rows', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'COMPLETED',
      isRecurringFromTemplate: false,
    });
    expect(sublabel?.label).toBe('Complete');
    expect(sublabel?.className).toContain('emerald');
  });

  it('shows Recurring for stored RECURRING status', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'RECURRING',
      isRecurringFromTemplate: false,
    });
    expect(sublabel?.label).toBe('Rec');
    expect(sublabel?.className).toContain('violet');
  });

  it('shows Draft for legacy program rows still in DRAFT', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'DRAFT',
      isRecurringFromTemplate: true,
    });
    expect(sublabel?.label).toBe('Draft');
  });

  it('shows Draft for draft rows without recurring template', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'DRAFT',
      isRecurringFromTemplate: false,
    });
    expect(sublabel?.label).toBe('Draft');
  });

  it('shows In progress for in-progress recurring rows', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'IN_PROGRESS',
      isRecurringFromTemplate: true,
    });
    expect(sublabel?.label).toBe('Active');
  });
});
