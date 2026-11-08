import { describe, expect, it } from 'vitest';
import { buildBatchInputStorageRows } from './batchInputStorageCheck';
import { computeBatchWipAvailableByItemId } from './batchStepWip';
import type { ProductionBatchItem, ProductionBatchStageLog } from '@/types/production';

function stageLog(
  partial: Partial<ProductionBatchStageLog> & Pick<ProductionBatchStageLog, 'id' | 'stage_order'>
): ProductionBatchStageLog {
  return {
    workspace_id: 1,
    batch_id: 1,
    formula_stage_id: partial.formula_stage_id ?? partial.id,
    stage_name: 'Step',
    production_line_id: 1,
    status: 'pending',
    started_at: null,
    completed_at: null,
    input_quantity: null,
    output_quantity: null,
    waste_quantity: null,
    notes: null,
    logged_by: null,
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('computeBatchWipAvailableByItemId', () => {
  it('adds completed prior step output for next step input item', () => {
    const wip = computeBatchWipAvailableByItemId({
      stageLogs: [
        stageLog({ id: 1, stage_order: 0, status: 'completed', output_quantity: 50, formula_stage_id: 10 }),
        stageLog({ id: 2, stage_order: 1, status: 'pending', formula_stage_id: 11 }),
      ],
      currentStageLog: stageLog({ id: 2, stage_order: 1, formula_stage_id: 11 }),
      formulaStageItems: [
        {
          id: 1,
          workspace_id: 1,
          formula_stage_id: 10,
          item_id: 100,
          item_role: 'output',
          quantity: 50,
          unit: 'kg',
          is_optional: false,
          tolerance_percentage: null,
        },
        {
          id: 2,
          workspace_id: 1,
          formula_stage_id: 11,
          item_id: 100,
          item_role: 'input',
          quantity: 50,
          unit: 'kg',
          is_optional: false,
          tolerance_percentage: null,
        },
      ],
      formulaStages: [
        { id: 10, expected_output_item_id: 100 },
        { id: 11, expected_output_item_id: null },
      ],
      batchItems: [],
    });
    expect(wip.get(100)).toBe(50);
  });
});

describe('buildBatchInputStorageRows with WIP', () => {
  it('does not mark short when prior step output covers required', () => {
    const rows = buildBatchInputStorageRows({
      inputItems: [
        {
          id: 1,
          workspace_id: 1,
          batch_id: 1,
          item_id: 100,
          item_role: 'input',
          expected_quantity: 50,
          actual_quantity: null,
          source_location_type: null,
          source_location_id: null,
          destination_location_type: null,
          destination_location_id: null,
          variance_quantity: null,
          variance_percentage: null,
          notes: null,
        } as ProductionBatchItem,
      ],
      storageRows: [{ factory_id: 1, item_id: 100, qty: 0 }],
      defaultFactoryId: 1,
      stageLogs: [
        stageLog({ id: 1, stage_order: 0, status: 'completed', output_quantity: 50, formula_stage_id: 10 }),
        stageLog({ id: 2, stage_order: 1, status: 'pending', formula_stage_id: 11 }),
      ],
      currentStageLog: stageLog({ id: 2, stage_order: 1, formula_stage_id: 11 }),
      formulaStageItems: [
        {
          id: 1,
          workspace_id: 1,
          formula_stage_id: 10,
          item_id: 100,
          item_role: 'output',
          quantity: 50,
          unit: 'kg',
          is_optional: false,
          tolerance_percentage: null,
        },
      ],
      formulaStages: [{ id: 10, expected_output_item_id: 100 }],
    });
    expect(rows[0].onHandStorage).toBe(0);
    expect(rows[0].fromPriorSteps).toBe(50);
    expect(rows[0].onHand).toBe(50);
    expect(rows[0].isShort).toBe(false);
  });
});
