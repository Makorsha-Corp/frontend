import type { ProductionBatchStageLog } from '@/types/production';

/** True when an earlier step is still pending or in progress. */
export function earlierStepsBlockStart(
  log: ProductionBatchStageLog,
  stageLogs: ProductionBatchStageLog[],
): boolean {
  return stageLogs.some(
    (other) =>
      other.stage_order < log.stage_order &&
      (other.status === 'pending' || other.status === 'in_progress'),
  );
}

export function batchHasOpenSteps(stageLogs: ProductionBatchStageLog[]): boolean {
  return stageLogs.some((log) => log.status === 'pending' || log.status === 'in_progress');
}

/** True when finishing/skipping this log closes the last open step on the batch. */
export function isLastOpenStep(
  targetLog: ProductionBatchStageLog,
  stageLogs: ProductionBatchStageLog[],
): boolean {
  if (stageLogs.length === 0) return false;
  return stageLogs.every((log) => {
    if (log.id === targetLog.id) {
      return log.status === 'in_progress' || log.status === 'pending';
    }
    return log.status === 'completed' || log.status === 'skipped';
  });
}
