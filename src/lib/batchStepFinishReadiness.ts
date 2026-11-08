import { appendUnitInParens } from '@/lib/productionStageMaterialsDisplay';
import {
  buildBatchStepMaterialRows,
  isMaterialActualMissing,
  type BatchStepMaterialRow,
} from '@/lib/batchStepMaterialRows';
import type {
  ProductionBatchItem,
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionBatchStageParameter,
  ProductionFormulaStageItem,
  ProductionFormulaStageParameter,
} from '@/types/production';
import { sortStageParameters } from '@/lib/productionStageMaterialsDisplay';

export type StepFinishReadiness = {
  ready: boolean;
  missingMaterialLabels: string[];
  missingConditionLabels: string[];
  missingMaterialRowKeys: string[];
  missingConditionSourceIds: number[];
};

function materialLabel(row: BatchStepMaterialRow, getItemName: (id: number) => string): string {
  const role =
    row.role === 'input'
      ? 'Input'
      : row.role === 'output'
        ? 'Output'
        : row.role === 'waste'
          ? 'Waste'
          : 'Byproduct';
  return `${role}: ${appendUnitInParens(getItemName(row.itemId), row.unit)}`;
}

function missingConditionActuals(
  stageLog: ProductionBatchStageLog,
  stageParameters: ProductionBatchStageParameter[],
  formulaStageParameters: ProductionFormulaStageParameter[],
): { labels: string[]; sourceIds: number[] } {
  const stageId = stageLog.formula_stage_id;
  if (stageId == null) return { labels: [], sourceIds: [] };

  const batchBySource = new Map<number, ProductionBatchStageParameter>();
  for (const row of stageParameters) {
    if (row.source_parameter_id != null) {
      batchBySource.set(row.source_parameter_id, row);
    }
  }

  const formulaRows = sortStageParameters(
    formulaStageParameters.filter((row) => row.formula_stage_id === stageId),
  );

  const labels: string[] = [];
  const sourceIds: number[] = [];
  for (const formulaRow of formulaRows) {
    const batchParam = batchBySource.get(formulaRow.id) ?? null;
    const actual = batchParam?.actual_value;
    const empty =
      actual == null || (typeof actual === 'string' && actual.trim() === '');
    if (empty) {
      labels.push(formulaRow.label);
      sourceIds.push(formulaRow.id);
    }
  }
  return { labels, sourceIds };
}

export function getStepFinishReadiness(input: {
  stageLog: ProductionBatchStageLog | null;
  formulaStageItems: ProductionFormulaStageItem[];
  batchItems: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
  formulaStageParameters: ProductionFormulaStageParameter[];
  stageParameters: ProductionBatchStageParameter[];
  getItemName: (id: number) => string;
}): StepFinishReadiness {
  const { stageLog, getItemName } = input;
  if (!stageLog || stageLog.status !== 'in_progress') {
    return {
      ready: true,
      missingMaterialLabels: [],
      missingConditionLabels: [],
      missingMaterialRowKeys: [],
      missingConditionSourceIds: [],
    };
  }

  const rows = buildBatchStepMaterialRows({
    stageLog,
    formulaStageItems: input.formulaStageItems,
    batchItems: input.batchItems,
    stepItems: input.stepItems,
  });
  const missingMaterialLabels: string[] = [];
  const missingMaterialRowKeys: string[] = [];

  for (const row of rows) {
    if (isMaterialActualMissing(row)) {
      missingMaterialLabels.push(materialLabel(row, getItemName));
      missingMaterialRowKeys.push(row.key);
    }
  }

  const missingConditions = missingConditionActuals(
    stageLog,
    input.stageParameters,
    input.formulaStageParameters,
  );

  return {
    ready:
      missingMaterialLabels.length === 0 && missingConditions.labels.length === 0,
    missingMaterialLabels,
    missingConditionLabels: missingConditions.labels,
    missingMaterialRowKeys,
    missingConditionSourceIds: missingConditions.sourceIds,
  };
}
