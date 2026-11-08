import type {
  ItemRole,
  ProductionFormulaStageItem,
  ProductionFormulaStageParameter,
} from '@/types/production';

export const STAGE_MATERIAL_ROLE_ORDER: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];

export function formatStageParameterPlanned(row: ProductionFormulaStageParameter): string {
  const unit = row.unit?.trim();
  return unit ? `${row.planned_value} ${unit}` : row.planned_value;
}

/** e.g. "Turns" + "spins" → "Turns (spins)" */
export function appendUnitInParens(label: string, unit: string | null | undefined): string {
  const trimmed = unit?.trim();
  if (!trimmed) return label;
  return `${label} (${trimmed})`;
}

const looksNumeric = (value: string): boolean => /^-?\d/.test(value.trim());

/** Compact unit beside condition name in batch tables (full value in title). */
export function shortenConditionUnitLabel(unit: string, maxLetters = 4): string {
  const trimmed = unit.trim();
  if (trimmed.length <= maxLetters) return trimmed;
  return `${trimmed.slice(0, maxLetters)}.`;
}

/** Expected column: numeric planned value + unit suffix beside the field (not in the label). */
export function resolveConditionPlannedDisplay(input: {
  planned_value: string;
  planned_value_numeric: number | null;
  unit: string | null | undefined;
}): { planned: string; unitSuffix: string | null } {
  const unitTrim = input.unit?.trim() ?? '';
  const plannedTrim = input.planned_value.trim();

  if (input.planned_value_numeric != null && Number.isFinite(input.planned_value_numeric)) {
    let unitSuffix: string | null = null;
    if (unitTrim && !looksNumeric(unitTrim)) unitSuffix = unitTrim;
    else if (plannedTrim && !looksNumeric(plannedTrim)) unitSuffix = plannedTrim;
    return { planned: String(input.planned_value_numeric), unitSuffix };
  }

  if (plannedTrim && looksNumeric(plannedTrim)) {
    return {
      planned: plannedTrim,
      unitSuffix: unitTrim && !looksNumeric(unitTrim) ? unitTrim : null,
    };
  }

  // Legacy rows where planned_value holds the unit and unit holds the number
  if (unitTrim && looksNumeric(unitTrim)) {
    return {
      planned: unitTrim,
      unitSuffix: plannedTrim || null,
    };
  }

  return {
    planned: plannedTrim,
    unitSuffix: unitTrim || null,
  };
}

export function sortStageParameters(
  rows: ProductionFormulaStageParameter[],
): ProductionFormulaStageParameter[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

export type StageMaterialDisplayRow =
  | { kind: 'item'; row: ProductionFormulaStageItem }
  | { kind: 'condition'; row: ProductionFormulaStageParameter };

/** Inputs, then step conditions, then output / waste / byproduct. */
export function buildStageMaterialDisplayRows(
  stageItems: ProductionFormulaStageItem[],
  stageParameters: ProductionFormulaStageParameter[],
  stageId: number,
): StageMaterialDisplayRow[] {
  const materials = stageItems.filter((row) => row.formula_stage_id === stageId);
  const inputs = materials.filter((row) => row.item_role === 'input');
  const afterInputs = STAGE_MATERIAL_ROLE_ORDER.filter((role) => role !== 'input').flatMap((role) =>
    materials.filter((row) => row.item_role === role),
  );
  const conditions = sortStageParameters(
    stageParameters.filter((row) => row.formula_stage_id === stageId),
  );

  const result: StageMaterialDisplayRow[] = [];
  for (const row of inputs) result.push({ kind: 'item', row });
  for (const row of conditions) result.push({ kind: 'condition', row });
  for (const row of afterInputs) result.push({ kind: 'item', row });
  return result;
}

export function stageHasMaterialsOrConditions(
  stageItems: ProductionFormulaStageItem[],
  stageParameters: ProductionFormulaStageParameter[],
  stageId: number,
): boolean {
  return buildStageMaterialDisplayRows(stageItems, stageParameters, stageId).length > 0;
}
