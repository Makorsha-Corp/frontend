export interface ProductionScheduleWindow {
  batchId: number;
  batchNumber: string;
  productionLineId: number | null;
  machineId: number | null;
  plannedStartAt: string;
  plannedEndAt: string;
}

export interface ProductionScheduleConflict {
  batchId: number;
  batchNumber: string;
  reason: 'line' | 'machine';
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Same line or same machine, overlapping planned windows. Never a hard block. */
export function findProductionScheduleConflicts(
  candidate: ProductionScheduleWindow,
  others: ProductionScheduleWindow[],
): ProductionScheduleConflict[] {
  const start = new Date(candidate.plannedStartAt).getTime();
  const end = new Date(candidate.plannedEndAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const conflicts: ProductionScheduleConflict[] = [];
  for (const other of others) {
    if (other.batchId === candidate.batchId) continue;
    const otherStart = new Date(other.plannedStartAt).getTime();
    const otherEnd = new Date(other.plannedEndAt).getTime();
    if (!rangesOverlap(start, end, otherStart, otherEnd)) continue;
    const sameLine =
      candidate.productionLineId != null &&
      other.productionLineId != null &&
      candidate.productionLineId === other.productionLineId;
    const sameMachine =
      candidate.machineId != null && other.machineId != null && candidate.machineId === other.machineId;
    if (!sameLine && !sameMachine) continue;
    conflicts.push({
      batchId: other.batchId,
      batchNumber: other.batchNumber,
      reason: sameLine ? 'line' : 'machine',
    });
  }
  return conflicts;
}

export function sequentialStepWindows(input: {
  batchId: number;
  batchNumber: string;
  plannedStartAt: string;
  steps: { productionLineId: number | null; machineId: number | null; expectedMinutes: number }[];
}): ProductionScheduleWindow[] {
  const startMs = new Date(input.plannedStartAt).getTime();
  if (!Number.isFinite(startMs)) return [];
  let cursor = startMs;
  return input.steps.map((step) => {
    const minutes = Number.isFinite(step.expectedMinutes) && step.expectedMinutes > 0 ? step.expectedMinutes : 0;
    const end = cursor + minutes * 60_000;
    const window: ProductionScheduleWindow = {
      batchId: input.batchId,
      batchNumber: input.batchNumber,
      productionLineId: step.productionLineId,
      machineId: step.machineId,
      plannedStartAt: new Date(cursor).toISOString(),
      plannedEndAt: new Date(end).toISOString(),
    };
    cursor = end;
    return window;
  });
}

export function formatStageMetric(value: number | null | undefined, digits = 0): string | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `${Number(value).toFixed(digits)}%`;
}
