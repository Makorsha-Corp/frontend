/** Sentinel: no recipes selected (invalid as a real formula id). */
export const ACTIVITY_RECIPE_FILTER_NONE = -1;

export function isNoActivityRecipesSelected(selectedIds: number[]): boolean {
  return selectedIds.length === 1 && selectedIds[0] === ACTIVITY_RECIPE_FILTER_NONE;
}

export function isAllActivityRecipesSelected(
  selectedIds: number[],
  activeFormulaIds: number[],
): boolean {
  if (activeFormulaIds.length === 0) return true;
  if (selectedIds.length === 0) return true;
  if (isNoActivityRecipesSelected(selectedIds)) return false;
  return activeFormulaIds.every((id) => selectedIds.includes(id));
}

export function isActivityRecipeChecked(selectedIds: number[], formulaId: number): boolean {
  if (selectedIds.length === 0) return true;
  if (isNoActivityRecipesSelected(selectedIds)) return false;
  return selectedIds.includes(formulaId);
}

export function toggleActivityRecipeId(
  selectedIds: number[],
  formulaId: number,
  activeFormulaIds: number[],
): number[] {
  if (selectedIds.length === 0) {
    return activeFormulaIds.filter((id) => id !== formulaId);
  }
  if (isNoActivityRecipesSelected(selectedIds)) {
    return [formulaId];
  }
  if (selectedIds.includes(formulaId)) {
    const next = selectedIds.filter((id) => id !== formulaId);
    if (next.length === 0) return [ACTIVITY_RECIPE_FILTER_NONE];
    return next;
  }
  const next = [...selectedIds, formulaId];
  if (activeFormulaIds.length > 0 && activeFormulaIds.every((id) => next.includes(id))) {
    return [];
  }
  return next;
}

export function toggleAllActivityRecipes(
  selectedIds: number[],
  activeFormulaIds: number[],
): number[] {
  if (activeFormulaIds.length === 0) return [];
  if (selectedIds.length === 0 || isAllActivityRecipesSelected(selectedIds, activeFormulaIds)) {
    return [ACTIVITY_RECIPE_FILTER_NONE];
  }
  return [];
}

/** API / client heatmap: undefined = all recipes. */
export function activityFormulaIdsForQuery(selectedIds: number[]): number[] | undefined {
  if (selectedIds.length === 0) return undefined;
  if (isNoActivityRecipesSelected(selectedIds)) return [ACTIVITY_RECIPE_FILTER_NONE];
  return selectedIds;
}

export function isDefaultActivityRecipeFilter(selectedIds: number[]): boolean {
  return selectedIds.length === 0;
}

export function productionActivityRecipeFilterLabel(
  formulas: { id: number; name: string }[],
  selectedIds: number[],
): string {
  if (isNoActivityRecipesSelected(selectedIds)) return 'No recipes';
  if (isDefaultActivityRecipeFilter(selectedIds)) return 'All recipes';
  if (selectedIds.length === 1) {
    return formulas.find((f) => f.id === selectedIds[0])?.name ?? '1 recipe';
  }
  return `${selectedIds.length} recipes`;
}
