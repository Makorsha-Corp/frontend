import { computeBatchWipAvailableByItemId } from '@/lib/batchStepWip';
import type { Inventory } from '@/types/inventory';
import type {
  ProductionBatchItem,
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionFormulaStage,
  ProductionFormulaStageItem,
} from '@/types/production';

export function resolveStorageFactoryId(
  batchItem: Pick<ProductionBatchItem, 'source_location_type' | 'source_location_id'>,
  defaultFactoryId: number
): number {
  if (batchItem.source_location_type === 'storage' && batchItem.source_location_id != null) {
    return batchItem.source_location_id;
  }
  return defaultFactoryId;
}

/** API Decimal fields arrive as strings ("3.00"). Coerce before math so 0 + "3.00" is not "03.00". */
export function asStorageQty(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function requiredInputQty(
  batchItem: Pick<ProductionBatchItem, 'actual_quantity' | 'expected_quantity'>
): number {
  return asStorageQty(batchItem.actual_quantity ?? batchItem.expected_quantity ?? 0);
}

function requiredQtyForStep(
  batchItem: ProductionBatchItem,
  currentStageLog: ProductionBatchStageLog | null,
  stepItems: ProductionBatchStageItem[]
): number {
  if (currentStageLog) {
    const stepRow = stepItems.find(
      (row) =>
        row.batch_stage_log_id === currentStageLog.id &&
        row.item_id === batchItem.item_id &&
        row.item_role === 'input'
    );
    if (stepRow) {
      return asStorageQty(stepRow.actual_quantity ?? stepRow.expected_quantity ?? 0);
    }
  }
  return requiredInputQty(batchItem);
}

export function onHandStorageQty(
  storageRows: Pick<Inventory, 'factory_id' | 'item_id' | 'qty'>[],
  factoryId: number,
  itemId: number
): number {
  let total = 0;
  for (const row of storageRows) {
    if (row.factory_id === factoryId && row.item_id === itemId) {
      total += asStorageQty(row.qty);
    }
  }
  return total;
}

export type BatchInputStorageRow = {
  batchItemId: number;
  itemId: number;
  required: number;
  /** Storage snapshot only. */
  onHandStorage: number;
  /** From completed earlier steps in this batch. */
  fromPriorSteps: number;
  /** Storage + in-batch WIP. */
  onHand: number;
  factoryId: number;
  isShort: boolean;
  isHighlighted: boolean;
};

export function stepInputItemIds(
  stageLog: Pick<ProductionBatchStageLog, 'formula_stage_id'> | null | undefined,
  formulaStageItems: ProductionFormulaStageItem[]
): Set<number> {
  const stageId = stageLog?.formula_stage_id;
  if (stageId == null) return new Set();
  return new Set(
    formulaStageItems
      .filter((row) => row.formula_stage_id === stageId && row.item_role === 'input')
      .map((row) => row.item_id)
  );
}

export function buildBatchInputStorageRows(input: {
  inputItems: ProductionBatchItem[];
  storageRows: Pick<Inventory, 'factory_id' | 'item_id' | 'qty'>[];
  defaultFactoryId: number;
  highlightItemIds?: Set<number>;
  stageLogs?: ProductionBatchStageLog[];
  currentStageLog?: ProductionBatchStageLog | null;
  formulaStageItems?: ProductionFormulaStageItem[];
  formulaStages?: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[];
  allBatchItems?: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
}): BatchInputStorageRow[] {
  const {
    inputItems,
    storageRows,
    defaultFactoryId,
    highlightItemIds,
    stageLogs = [],
    currentStageLog = null,
    formulaStageItems = [],
    formulaStages = [],
    allBatchItems = inputItems,
    stepItems = [],
  } = input;
  const highlight = highlightItemIds ?? new Set<number>();

  const wipByItem =
    currentStageLog && stageLogs.length > 0
      ? computeBatchWipAvailableByItemId({
          stageLogs,
          currentStageLog,
          formulaStageItems,
          formulaStages,
          batchItems: allBatchItems,
          stepItems,
        })
      : new Map<number, number>();

  const rows: BatchInputStorageRow[] = [];
  for (const bi of inputItems) {
    const required = requiredQtyForStep(bi, currentStageLog, stepItems);
    if (required <= 0) continue;
    const factoryId = resolveStorageFactoryId(bi, defaultFactoryId);
    const onHandStorage = onHandStorageQty(storageRows, factoryId, bi.item_id);
    const fromPriorSteps = wipByItem.get(bi.item_id) ?? 0;
    const onHand = onHandStorage + fromPriorSteps;
    rows.push({
      batchItemId: bi.id,
      itemId: bi.item_id,
      required,
      onHandStorage,
      fromPriorSteps,
      onHand,
      factoryId,
      isShort: onHand < required,
      isHighlighted: highlight.has(bi.item_id),
    });
  }
  return rows;
}

export function shortagesFromRows(rows: BatchInputStorageRow[]): BatchInputStorageRow[] {
  return rows.filter((row) => row.isShort);
}

/** Quantity still needed from storage. Zero when on-hand already covers the step. */
export function storageGapQty(required: number, onHand: number): number {
  const gap = required - onHand;
  if (!(gap > 0)) return 0;
  return Math.round(gap * 100) / 100;
}
