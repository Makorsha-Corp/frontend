import { useMemo } from 'react';
import { useGetBatchItemsQuery } from '@/features/production/productionApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import type { Inventory } from '@/types/inventory';
import {
  buildBatchInputStorageRows,
  shortagesFromRows,
  stepInputItemIds,
  type BatchInputStorageRow,
} from '@/lib/batchInputStorageCheck';
import type {
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionFormulaStage,
  ProductionFormulaStageItem,
} from '@/types/production';

export interface UseBatchInputStoragePreviewArgs {
  batchId: number;
  lineFactoryId: number | undefined;
  enabled: boolean;
  stageLog?: ProductionBatchStageLog | null;
  formulaStageItems?: ProductionFormulaStageItem[];
  formulaStages?: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[];
  stageLogs?: ProductionBatchStageLog[];
  stepItems?: ProductionBatchStageItem[];
  highlightStepInputs?: boolean;
  /** When true, only inputs assigned to `stageLog` are checked (per-step start). */
  onlyStepInputs?: boolean;
}

export interface UseBatchInputStoragePreviewResult {
  rows: BatchInputStorageRow[];
  storageRows: Inventory[];
  shortages: BatchInputStorageRow[];
  loadingItems: boolean;
  loadingStorage: boolean;
  stockCheckLoading: boolean;
  noItems: boolean;
  noInputs: boolean;
  hasInputsWithQty: boolean;
  blockedByStock: boolean;
  canStartBatch: boolean;
}

export function useBatchInputStoragePreview({
  batchId,
  lineFactoryId,
  enabled,
  stageLog = null,
  formulaStageItems = [],
  formulaStages = [],
  stageLogs = [],
  stepItems = [],
  highlightStepInputs = false,
  onlyStepInputs = false,
}: UseBatchInputStoragePreviewArgs): UseBatchInputStoragePreviewResult {
  const { data: batchItems = [], isLoading: loadingItems } = useGetBatchItemsQuery(
    { batchId },
    { skip: !batchId }
  );

  const inputItems = useMemo(() => {
    const inputs = batchItems.filter((bi) => bi.item_role === 'input');
    if (!onlyStepInputs || !stageLog) return inputs;
    const ids = stepInputItemIds(stageLog, formulaStageItems);
    if (ids.size === 0) return [];
    return inputs.filter((bi) => ids.has(bi.item_id));
  }, [batchItems, onlyStepInputs, stageLog, formulaStageItems]);

  const previewActive = enabled && lineFactoryId != null;
  const needsStorage = previewActive && inputItems.length > 0;

  const { data: storageRows = [], isLoading: loadingStorage } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: 500,
      inventory_type: 'STORAGE',
    },
    { skip: !needsStorage }
  );

  const highlightItemIds = useMemo(() => {
    if (!highlightStepInputs) return new Set<number>();
    return stepInputItemIds(stageLog, formulaStageItems);
  }, [highlightStepInputs, stageLog, formulaStageItems]);

  const rows = useMemo(() => {
    if (!previewActive || lineFactoryId == null) return [];
    return buildBatchInputStorageRows({
      inputItems,
      storageRows,
      defaultFactoryId: lineFactoryId,
      highlightItemIds,
      stageLogs,
      currentStageLog: stageLog,
      formulaStageItems,
      formulaStages,
      allBatchItems: batchItems,
      stepItems,
    });
  }, [
    previewActive,
    lineFactoryId,
    inputItems,
    storageRows,
    highlightItemIds,
    stageLogs,
    stageLog,
    formulaStageItems,
    formulaStages,
    batchItems,
    stepItems,
  ]);

  const shortages = useMemo(() => shortagesFromRows(rows), [rows]);

  const noItems = enabled && !loadingItems && batchItems.length === 0;
  const noInputs = enabled && !loadingItems && batchItems.length > 0 && inputItems.length === 0;
  const hasInputsWithQty = rows.length > 0;
  const stockCheckLoading = needsStorage && loadingStorage;
  const blockedByStock = shortages.length > 0;

  const canStartBatch =
    enabled &&
    lineFactoryId != null &&
    !loadingItems &&
    !noItems &&
    !stockCheckLoading &&
    !blockedByStock &&
    (inputItems.length === 0 || hasInputsWithQty);

  return {
    rows,
    storageRows,
    shortages,
    loadingItems,
    loadingStorage,
    stockCheckLoading,
    noItems,
    noInputs,
    hasInputsWithQty,
    blockedByStock,
    canStartBatch,
  };
}
