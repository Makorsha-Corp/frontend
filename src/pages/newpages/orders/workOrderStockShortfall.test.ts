import { describe, expect, it } from 'vitest';
import {
  buildMachineQtyMap,
  buildStorageQtyMap,
  computeWorkOrderStockShortfalls,
  type WorkOrderStockSnapshot,
} from './workOrderStockShortfall';

function snapshot(partial: Partial<WorkOrderStockSnapshot>): WorkOrderStockSnapshot {
  return {
    storageByItemId: new Map(),
    machineByKey: new Map(),
    storageSourceLabel: 'Storage · Factory A',
    machineLabelById: new Map([[5, 'Loom 1']]),
    itemNameById: new Map([
      [100, 'Cotton Yarn'],
      [101, 'Bearing Seal'],
    ]),
    ...partial,
  };
}

describe('computeWorkOrderStockShortfalls', () => {
  it('returns empty when no lines', () => {
    expect(
      computeWorkOrderStockShortfalls({
        lines: [],
        occurrenceCount: 4,
        workOrderMachineId: 5,
        factoryId: 1,
        snapshot: snapshot({}),
      }),
    ).toEqual([]);
  });

  it('warns when recurring demand exceeds storage on hand', () => {
    const result = computeWorkOrderStockShortfalls({
      lines: [{ itemId: '100', quantity: '10', sourceType: 'storage' }],
      occurrenceCount: 4,
      workOrderMachineId: 5,
      factoryId: 1,
      snapshot: snapshot({
        storageByItemId: buildStorageQtyMap([{ item_id: 100, qty: 25 }]),
      }),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      itemName: 'Cotton Yarn',
      requiredQty: 40,
      onHandQty: 25,
      shortBy: 15,
      sourceLabel: 'Storage · Factory A',
    });
  });

  it('does not warn when single order fits stock', () => {
    const result = computeWorkOrderStockShortfalls({
      lines: [{ itemId: '100', quantity: '5', sourceType: 'storage' }],
      occurrenceCount: 1,
      workOrderMachineId: 5,
      factoryId: 1,
      snapshot: snapshot({
        storageByItemId: buildStorageQtyMap([{ item_id: 100, qty: 10 }]),
      }),
    });

    expect(result).toEqual([]);
  });

  it('aggregates duplicate lines for same item and source', () => {
    const result = computeWorkOrderStockShortfalls({
      lines: [
        { itemId: '100', quantity: '3', sourceType: 'storage' },
        { itemId: '100', quantity: '2', sourceType: 'storage' },
      ],
      occurrenceCount: 2,
      workOrderMachineId: 5,
      factoryId: 1,
      snapshot: snapshot({
        storageByItemId: buildStorageQtyMap([{ item_id: 100, qty: 8 }]),
      }),
    });

    expect(result[0]?.requiredQty).toBe(10);
    expect(result[0]?.shortBy).toBe(2);
  });

  it('uses machine stock for machine-sourced lines', () => {
    const machineByKey = buildMachineQtyMap([{ machine_id: 5, item_id: 101, qty: 2 }]);
    const result = computeWorkOrderStockShortfalls({
      lines: [{ itemId: '101', quantity: '3', sourceType: 'machine', sourceMachineId: 5 }],
      occurrenceCount: 1,
      workOrderMachineId: 5,
      factoryId: 1,
      snapshot: snapshot({ machineByKey }),
    });

    expect(result[0]).toMatchObject({
      itemName: 'Bearing Seal',
      sourceLabel: 'Machine · Loom 1',
      requiredQty: 3,
      onHandQty: 2,
      shortBy: 1,
    });
  });

  it('treats missing stock rows as zero on hand', () => {
    const result = computeWorkOrderStockShortfalls({
      lines: [{ itemId: '100', quantity: '1', sourceType: 'storage' }],
      occurrenceCount: 1,
      workOrderMachineId: 5,
      factoryId: 1,
      snapshot: snapshot({ storageByItemId: new Map() }),
    });

    expect(result[0]?.onHandQty).toBe(0);
    expect(result[0]?.shortBy).toBe(1);
  });
});
