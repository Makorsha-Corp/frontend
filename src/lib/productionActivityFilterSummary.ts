import type { ProductionFormula, ProductionLine } from '@/types/production';
import { isNoActivityRecipesSelected } from '@/lib/productionActivityRecipeFilter';

export type ProductionActivityFilterCopy = {
  allLines?: string;
  oneLine?: string;
  lineCount?: (count: number) => string;
  allRecipes?: string;
  noRecipes?: string;
  oneRecipe?: string;
  recipeCount?: (count: number) => string;
};

export function productionActivityFilterSummary(
  lines: ProductionLine[],
  formulas: ProductionFormula[],
  lineIds: number[],
  formulaIds: number[],
  copy?: ProductionActivityFilterCopy,
): string {
  const lineLabel =
    lineIds.length === 0
      ? (copy?.allLines ?? 'All lines')
      : lineIds.length === 1
        ? (lines.find((l) => l.id === lineIds[0])?.name ?? copy?.oneLine ?? '1 line')
        : (copy?.lineCount?.(lineIds.length) ?? `${lineIds.length} lines`);
  const formulaLabel = isNoActivityRecipesSelected(formulaIds)
    ? (copy?.noRecipes ?? 'No recipes')
    : formulaIds.length === 0
      ? (copy?.allRecipes ?? 'All recipes')
      : formulaIds.length === 1
        ? (formulas.find((f) => f.id === formulaIds[0])?.name ?? copy?.oneRecipe ?? '1 recipe')
        : (copy?.recipeCount?.(formulaIds.length) ?? `${formulaIds.length} recipes`);
  return `${lineLabel} · ${formulaLabel}`;
}
