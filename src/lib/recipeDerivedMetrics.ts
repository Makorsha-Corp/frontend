import type { ProductionFormulaStage, ProductionFormulaStageItem } from '@/types/production';

export function sortFormulaStages(stages: ProductionFormulaStage[]): ProductionFormulaStage[] {
  return [...stages].sort((a, b) => a.stage_order - b.stage_order);
}

export function lastFormulaStage(stages: ProductionFormulaStage[]): ProductionFormulaStage | null {
  const sorted = sortFormulaStages(stages);
  return sorted.length > 0 ? sorted[sorted.length - 1]! : null;
}

/** Finished-good qty = sum of output-role materials on the last path step only. */
export function finishedGoodOutputQuantity(
  stages: ProductionFormulaStage[],
  stageItems: ProductionFormulaStageItem[],
): number {
  const last = lastFormulaStage(stages);
  if (!last) return 0;
  return stageItems
    .filter((row) => row.formula_stage_id === last.id && row.item_role === 'output')
    .reduce((sum, row) => sum + row.quantity, 0);
}

export function finishedGoodOutputItemIds(
  stages: ProductionFormulaStage[],
  stageItems: ProductionFormulaStageItem[],
): number[] {
  const last = lastFormulaStage(stages);
  if (!last) return [];
  return stageItems
    .filter((row) => row.formula_stage_id === last.id && row.item_role === 'output')
    .map((row) => row.item_id);
}

/** Sum of per-step expected_duration_minutes (null if no step has minutes). */
export function estimatedRecipeDurationMinutes(stages: ProductionFormulaStage[]): number | null {
  const sorted = sortFormulaStages(stages);
  if (sorted.length === 0) return null;
  let sum = 0;
  let any = false;
  for (const stage of sorted) {
    if (stage.expected_duration_minutes != null) {
      sum += stage.expected_duration_minutes;
      any = true;
    }
  }
  return any ? sum : null;
}
