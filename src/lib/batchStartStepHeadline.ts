import type { BatchInputStorageRow } from '@/lib/batchInputStorageCheck';

export function batchStartStepDescription(input: {
  rows: BatchInputStorageRow[];
  batchIsDraft: boolean;
  hasShortage: boolean;
}): string {
  const { rows, batchIsDraft, hasShortage } = input;
  if (hasShortage) {
    return 'Some inputs are short. Add stock or create a purchase before starting.';
  }

  const stepRows = rows.filter((row) => row.isHighlighted);
  const draftPrefix = batchIsDraft ? 'Starting this step begins the batch. ' : '';

  if (stepRows.length === 0) {
    return `${draftPrefix}Use “Log Earlier Start” if work already began.`;
  }

  const allFromPriorSteps = stepRows.every((row) => row.fromPriorSteps >= row.required);
  const drawsFromStorage = stepRows.some((row) => row.fromPriorSteps < row.required);

  if (allFromPriorSteps) {
    return `${draftPrefix}Uses what the last step made. Storage stays as it is.`;
  }
  if (drawsFromStorage) {
    return `${draftPrefix}Takes the rest from storage.`;
  }

  return `${draftPrefix}Use “Log Earlier Start” if work already began.`;
}
