import type { ProductionFormula, ProductionLine } from '@/types/production';
import { isNoActivityRecipesSelected } from '@/lib/productionActivityRecipeFilter';

export function productionActivityFilterSummary(
  lines: ProductionLine[],
  formulas: ProductionFormula[],
  lineIds: number[],
  formulaIds: number[],
): string {
  const lineLabel =
    lineIds.length === 0
      ? 'All lines'
      : lineIds.length === 1
        ? (lines.find((l) => l.id === lineIds[0])?.name ?? '1 line')
        : `${lineIds.length} lines`;
  const formulaLabel = isNoActivityRecipesSelected(formulaIds)
    ? 'No recipes'
    : formulaIds.length === 0
      ? 'All recipes'
      : formulaIds.length === 1
        ? (formulas.find((f) => f.id === formulaIds[0])?.name ?? '1 recipe')
        : `${formulaIds.length} recipes`;
  return `${lineLabel} · ${formulaLabel}`;
}
