import type {
  ItemRole,
  ProductionBatchItem,
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionFormulaStageItem,
} from '@/types/production';

export type BatchStepMaterialRow = {
  key: string;
  itemId: number;
  role: ItemRole;
  unit: string | null;
  expected: number | null;
  actual: number | null;
  batchItem: ProductionBatchItem | null;
  stepItem: ProductionBatchStageItem | null;
};

export function buildBatchStepMaterialRows(input: {
  stageLog: ProductionBatchStageLog | null;
  formulaStageItems: ProductionFormulaStageItem[];
  batchItems: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
}): BatchStepMaterialRow[] {
  const { stageLog, formulaStageItems, batchItems, stepItems = [] } = input;
  if (!stageLog) return [];

  const forLog = stepItems.filter((row) => row.batch_stage_log_id === stageLog.id);
  if (forLog.length > 0) {
    return forLog.map((row) => {
      const batchItem =
        batchItems.find((bi) => bi.item_id === row.item_id && bi.item_role === row.item_role) ??
        null;
      const formula = formulaStageItems.find(
        (def) => def.formula_stage_id === stageLog.formula_stage_id && def.item_id === row.item_id && def.item_role === row.item_role,
      );
      return {
        key: `si-${row.id}`,
        itemId: row.item_id,
        role: row.item_role,
        unit: formula?.unit?.trim() || null,
        expected: row.expected_quantity,
        actual: row.actual_quantity,
        batchItem,
        stepItem: row,
      };
    });
  }

  const stageId = stageLog.formula_stage_id;
  const stageDefs =
    stageId != null
      ? formulaStageItems.filter((row) => row.formula_stage_id === stageId)
      : [];

  if (stageDefs.length === 0) {
    return batchItems.map((bi) => ({
      key: `bi-${bi.id}`,
      itemId: bi.item_id,
      role: bi.item_role as ItemRole,
      unit: null,
      expected: bi.expected_quantity,
      actual: bi.actual_quantity,
      batchItem: bi,
      stepItem: null,
    }));
  }

  return stageDefs.map((def) => {
    const batchItem =
      batchItems.find((bi) => bi.item_id === def.item_id && bi.item_role === def.item_role) ??
      null;
    return {
      key: `fs-${def.id}`,
      itemId: def.item_id,
      role: def.item_role as ItemRole,
      unit: def.unit?.trim() || null,
      expected: batchItem?.expected_quantity ?? def.quantity,
      actual: batchItem?.actual_quantity ?? null,
      batchItem,
      stepItem: null,
    };
  });
}

export function isMaterialActualMissing(row: BatchStepMaterialRow): boolean {
  if (row.stepItem != null) return row.stepItem.actual_quantity == null;
  if (row.batchItem == null) return true;
  return row.actual == null;
}
