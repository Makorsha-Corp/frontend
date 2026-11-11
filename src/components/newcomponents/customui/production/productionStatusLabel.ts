import type { TFunction } from 'i18next';

const STATUS_KEYS: Record<string, string> = {
  draft: 'statusDraft',
  recurring: 'statusRecurring',
  in_progress: 'statusInProgress',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

export function productionStatusLabel(status: string, t: (key: string) => string): string {
  const key = STATUS_KEYS[status];
  return key ? t(key) : status.replace(/_/g, ' ');
}

export function productionFilterCopy(t: TFunction<'production'>) {
  return {
    allLines: t('allLines'),
    noLines: t('noLines'),
    oneLine: t('oneLine'),
    lineCount: (count: number) => t('lineCount', { count }),
    allRecipes: t('allRecipes'),
    noRecipes: t('noRecipes'),
    oneRecipe: t('oneRecipe'),
    recipeCount: (count: number) => t('recipeCount', { count }),
    defaultStatuses: t('defaultStatuses'),
    allStatuses: t('allStatuses'),
    noStatuses: t('noStatuses'),
    statusCount: (count: number) => t('statusCount', { count }),
    completed: t('statusCompleted'),
    hints: {
      week: t('hintRecurringWeek'),
      day: t('hintRecurringDay'),
      all: t('hintRecurringAll'),
      generic: t('hintRecurringGeneric'),
    },
  };
}
