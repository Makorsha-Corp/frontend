import { describe, expect, it } from 'vitest';
import {
  buildBatchInputStorageRows,
  onHandStorageQty,
  requiredInputQty,
  resolveStorageFactoryId,
  shortagesFromRows,
  stepInputItemIds,
  storageGapQty,
} from './batchInputStorageCheck';
import type { ProductionBatchItem, ProductionFormulaStageItem } from '@/types/production';

function batchItem(partial: Partial<ProductionBatchItem> & Pick<ProductionBatchItem, 'id' | 'item_id'>): ProductionBatchItem {
  return {
    workspace_id: 1,
    batch_id: 1,
    item_role: 'input',
    expected_quantity: 10,
    actual_quantity: null,
    source_location_type: null,
    source_location_id: null,
    destination_location_type: null,
    destination_location_id: null,
    variance_quantity: null,
    variance_percentage: null,
    notes: null,
    ...partial,
  };
}

describe('storageGapQty', () => {
  it('is the amount still needed from storage', () => {
    expect(storageGapQty(10, 4)).toBe(6);
  });

  it('is zero when on-hand covers the need', () => {
    expect(storageGapQty(4, 10)).toBe(0);
    expect(storageGapQty(4, 4)).toBe(0);
  });
});

describe('resolveStorageFactoryId', () => {
  it('uses source_location_id when storage', () => {
    expect(
      resolveStorageFactoryId(
        { source_location_type: 'storage', source_location_id: 99 },
        1
      )
    ).toBe(99);
  });

  it('falls back to line factory', () => {
    expect(
      resolveStorageFactoryId({ source_location_type: 'machine', source_location_id: 5 }, 1)
    ).toBe(1);
  });
});

describe('requiredInputQty', () => {
  it('prefers actual over expected', () => {
    expect(requiredInputQty({ actual_quantity: 7, expected_quantity: 10 })).toBe(7);
  });
});

describe('onHandStorageQty', () => {
  it('sums decimal strings without concatenating', () => {
    const onHand = onHandStorageQty(
      [{ factory_id: 1, item_id: 10, qty: '3.00' as unknown as number }],
      1,
      10
    );
    expect(onHand).toBe(3);
  });

  it('sums qty for matching factory and item', () => {
    const onHand = onHandStorageQty(
      [
        { factory_id: 1, item_id: 10, qty: 5 },
        { factory_id: 1, item_id: 10, qty: 3 },
        { factory_id: 2, item_id: 10, qty: 100 },
      ],
      1,
      10
    );
    expect(onHand).toBe(8);
  });
});

describe('buildBatchInputStorageRows', () => {
  it('does not mark short when string on-hand is greater than string required', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [
        batchItem({
          id: 1,
          item_id: 10,
          expected_quantity: '2.00' as unknown as number,
        }),
      ],
      storageRows: [{ factory_id: 1, item_id: 10, qty: '3.00' as unknown as number }],
      defaultFactoryId: 1,
    });
    expect(rows[0].required).toBe(2);
    expect(rows[0].onHandStorage).toBe(3);
    expect(rows[0].onHand).toBe(3);
    expect(rows[0].isShort).toBe(false);
  });

  it('marks short when on hand below required', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [batchItem({ id: 1, item_id: 10, expected_quantity: 20 })],
      storageRows: [{ factory_id: 1, item_id: 10, qty: 15 }],
      defaultFactoryId: 1,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].isShort).toBe(true);
    expect(shortagesFromRows(rows)).toHaveLength(1);
  });

  it('uses per-item storage factory for on hand', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [
        batchItem({
          id: 1,
          item_id: 10,
          expected_quantity: 5,
          source_location_type: 'storage',
          source_location_id: 2,
        }),
      ],
      storageRows: [
        { factory_id: 1, item_id: 10, qty: 0 },
        { factory_id: 2, item_id: 10, qty: 12 },
      ],
      defaultFactoryId: 1,
    });
    expect(rows[0].onHandStorage).toBe(12);
    expect(rows[0].onHand).toBe(12);
    expect(rows[0].isShort).toBe(false);
  });

  it('uses the step row actual as required', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [batchItem({ id: 1, item_id: 10, expected_quantity: 1 })],
      storageRows: [{ factory_id: 1, item_id: 10, qty: 0 }],
      defaultFactoryId: 1,
      currentStageLog: { id: 23, formula_stage_id: 8 } as never,
      stepItems: [
        {
          id: 3,
          batch_stage_log_id: 23,
          item_id: 10,
          item_role: 'input',
          expected_quantity: 1,
          actual_quantity: 0.4,
        } as never,
      ],
    });
    expect(rows[0].required).toBe(0.4);
  });

  it('highlights step input item ids', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [
        batchItem({ id: 1, item_id: 10 }),
        batchItem({ id: 2, item_id: 20 }),
      ],
      storageRows: [
        { factory_id: 1, item_id: 10, qty: 100 },
        { factory_id: 1, item_id: 20, qty: 100 },
      ],
      defaultFactoryId: 1,
      highlightItemIds: new Set([10]),
    });
    expect(rows.find((r) => r.itemId === 10)?.isHighlighted).toBe(true);
    expect(rows.find((r) => r.itemId === 20)?.isHighlighted).toBe(false);
  });
});

describe('stepInputItemIds', () => {
  const formulaItems: ProductionFormulaStageItem[] = [
    {
      id: 1,
      workspace_id: 1,
      formula_stage_id: 5,
      item_id: 10,
      item_role: 'input',
      quantity: 1,
      unit: 'kg',
      is_optional: false,
      tolerance_percentage: null,
    },
    {
      id: 2,
      workspace_id: 1,
      formula_stage_id: 5,
      item_id: 11,
      item_role: 'output',
      quantity: 1,
      unit: 'kg',
      is_optional: false,
      tolerance_percentage: null,
    },
  ];

  it('returns input item ids for stage', () => {
    const ids = stepInputItemIds({ formula_stage_id: 5 }, formulaItems);
    expect(ids.has(10)).toBe(true);
    expect(ids.has(11)).toBe(false);
  });
});
