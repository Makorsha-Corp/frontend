import { asStorageQty } from '@/lib/batchInputStorageCheck';
import type {
  ProductionBatchItem,
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionFormulaStage,
  ProductionFormulaStageItem,
} from '@/types/production';

export function resolveStageOutputItemId(
  log: Pick<ProductionBatchStageLog, 'formula_stage_id'>,
  formulaStageItems: ProductionFormulaStageItem[],
  formulaStages: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[]
): number | null {
  const stageId = log.formula_stage_id;
  if (stageId == null) return null;

  const stage = formulaStages.find((s) => s.id === stageId);
  if (stage?.expected_output_item_id != null) {
    return stage.expected_output_item_id;
  }

  const outputs = formulaStageItems
    .filter((row) => row.formula_stage_id === stageId && row.item_role === 'output')
    .sort((a, b) => a.id - b.id);
  return outputs[0]?.item_id ?? null;
}

/** Input qty per item for a step (matches batch item lines when present). */
export function stepInputQtyByItemId(input: {
  log: Pick<ProductionBatchStageLog, 'id' | 'formula_stage_id'>;
  formulaStageItems: ProductionFormulaStageItem[];
  batchItems: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
}): Map<number, number> {
  const { log, formulaStageItems, batchItems, stepItems = [] } = input;
  const forLog = stepItems.filter(
    (row) => row.batch_stage_log_id === log.id && row.item_role === 'input',
  );
  if (forLog.length > 0 || stepItems.some((row) => row.batch_stage_log_id === log.id)) {
    const byItem = new Map<number, number>();
    for (const row of forLog) {
      const qty = asStorageQty(row.actual_quantity ?? row.expected_quantity);
      if (qty > 0) byItem.set(row.item_id, (byItem.get(row.item_id) ?? 0) + qty);
    }
    return byItem;
  }
  const byItem = new Map<number, number>();

  if (log.formula_stage_id != null) {
    const stageInputs = formulaStageItems.filter(
      (row) => row.formula_stage_id === log.formula_stage_id && row.item_role === 'input'
    );
    for (const row of stageInputs) {
      const bi = batchItems.find(
        (item) => item.item_role === 'input' && item.item_id === row.item_id
      );
      const qty = asStorageQty(bi?.actual_quantity ?? bi?.expected_quantity ?? row.quantity);
      if (qty > 0) {
        byItem.set(row.item_id, (byItem.get(row.item_id) ?? 0) + qty);
      }
    }
    return byItem;
  }

  for (const bi of batchItems) {
    if (bi.item_role !== 'input') continue;
    const qty = asStorageQty(bi.actual_quantity ?? bi.expected_quantity);
    if (qty > 0) {
      byItem.set(bi.item_id, (byItem.get(bi.item_id) ?? 0) + qty);
    }
  }
  return byItem;
}

/**
 * WIP available from earlier steps when starting `currentStageLog`
 * (outputs from completed steps minus inputs consumed by started steps).
 */
export function computeBatchWipAvailableByItemId(input: {
  stageLogs: ProductionBatchStageLog[];
  currentStageLog: ProductionBatchStageLog;
  formulaStageItems: ProductionFormulaStageItem[];
  formulaStages: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[];
  batchItems: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
}): Map<number, number> {
  const { stageLogs, currentStageLog, formulaStageItems, formulaStages, batchItems, stepItems = [] } =
    input;
  const wip = new Map<number, number>();

  const sorted = [...stageLogs].sort(
    (a, b) => a.stage_order - b.stage_order || a.id - b.id
  );

  for (const log of sorted) {
    if (log.stage_order > currentStageLog.stage_order) break;
    if (log.id === currentStageLog.id) break;

    if (log.status === 'in_progress' || log.status === 'completed') {
      const inputs = stepInputQtyByItemId({ log, formulaStageItems, batchItems, stepItems });
      for (const [itemId, qty] of inputs) {
        const next = Math.max(0, (wip.get(itemId) ?? 0) - qty);
        wip.set(itemId, next);
      }
    }

    if (log.status === 'completed') {
      const outQty = asStorageQty(log.output_quantity);
      const outItemId = resolveStageOutputItemId(log, formulaStageItems, formulaStages);
      if (outQty > 0 && outItemId != null) {
        wip.set(outItemId, (wip.get(outItemId) ?? 0) + outQty);
      }
    }
  }

  return wip;
}

export type PriorStepHandoffDetail = {
  fromStageName: string;
  made: number;
  using: number;
  left: number;
};

export function priorStepHandoffDetail(input: {
  itemId: number;
  using: number;
  stageLogs: ProductionBatchStageLog[];
  currentStageLog: ProductionBatchStageLog;
  formulaStageItems: ProductionFormulaStageItem[];
  formulaStages: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[];
}): PriorStepHandoffDetail | null {
  const { itemId, using, stageLogs, currentStageLog, formulaStageItems, formulaStages } = input;
  const earlier = [...stageLogs]
    .filter(
      (log) =>
        log.id !== currentStageLog.id &&
        log.status === 'completed' &&
        (log.stage_order < currentStageLog.stage_order ||
          (log.stage_order === currentStageLog.stage_order && log.id < currentStageLog.id)),
    )
    .sort((a, b) => b.stage_order - a.stage_order || b.id - a.id);

  for (const log of earlier) {
    const outputItemId = resolveStageOutputItemId(log, formulaStageItems, formulaStages);
    if (outputItemId !== itemId) continue;
    const made = asStorageQty(log.output_quantity);
    if (made <= 0) continue;
    const left = Math.max(0, made - using);
    return { fromStageName: log.stage_name, made, using, left };
  }
  return null;
}

