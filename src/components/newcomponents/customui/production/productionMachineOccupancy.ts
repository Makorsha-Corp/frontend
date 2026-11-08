import type { ProductionScheduleBatch } from '@/types/production';
import { rangesOverlap } from '@/components/newcomponents/customui/production/productionScheduleConflict';

type OpenBatchForSchedule = {
  id: number;
  batch_number: string;
  status: string;
  machine_id?: number | null;
};

type StageLogForSchedule = {
  id: number;
  stage_name: string;
  stage_order: number;
  production_line_id: number | null;
  machine_id?: number | null;
  status: string;
  rework_of_log_id?: number | null;
};

type StepPlannedWindow = { plannedStartAt: string; plannedEndAt: string };

/** Build schedule row from open batch detail (stage logs + planned windows). */
export function scheduleBatchFromOpenRun(
  batch: OpenBatchForSchedule,
  stageLogs: StageLogForSchedule[],
  plannedWindows: StepPlannedWindow[],
): ProductionScheduleBatch | null {
  if (stageLogs.length === 0 || plannedWindows.length === 0) return null;
  const planned_start_at = plannedWindows[0].plannedStartAt;
  const planned_end_at = plannedWindows[plannedWindows.length - 1].plannedEndAt;
  return {
    batch_id: batch.id,
    batch_number: batch.batch_number,
    status: batch.status,
    machine_id: batch.machine_id ?? null,
    planned_start_at,
    planned_end_at,
    steps: stageLogs.map((log, idx) => {
      const w = plannedWindows[idx] ?? plannedWindows[plannedWindows.length - 1];
      return {
        stage_log_id: log.id,
        stage_name: log.stage_name,
        stage_order: log.stage_order,
        production_line_id: log.production_line_id,
        machine_id: log.machine_id ?? null,
        status: log.status,
        planned_start_at: w.plannedStartAt,
        planned_end_at: w.plannedEndAt,
        rework_of_log_id: log.rework_of_log_id ?? null,
      };
    }),
  };
}

/** Prefer fresh open-batch row over stale schedule API for the same batch id. */
export function mergeScheduleBatchesForLiveWork(
  fromApi: ProductionScheduleBatch[],
  local: ProductionScheduleBatch | null,
): ProductionScheduleBatch[] {
  if (!local) return fromApi;
  const rest = fromApi.filter((row) => row.batch_id !== local.batch_id);
  if (local.status === 'in_progress' || local.status === 'draft' || local.status === 'recurring') {
    return [...rest, local];
  }
  return fromApi;
}

export type MachineLiveWork = {
  batchNumber: string;
  stageName?: string;
  stageLogId?: number;
  /** Step already finished; machine status not idle yet. */
  stepFinished?: boolean;
};

export type MachineLiveWorkMap = Record<number, MachineLiveWork>;

export function formatBusyNowTooltip(live: MachineLiveWork | null | undefined): string {
  if (!live?.batchNumber?.trim()) {
    return 'Running now; your planned window is later and does not overlap.';
  }
  const stage = live.stageName?.trim();
  if (live.stepFinished && stage) {
    return `Busy with ${live.batchNumber} · ${stage} (step finished)`;
  }
  return stage
    ? `Busy with ${live.batchNumber} · ${stage}`
    : `Busy with ${live.batchNumber}`;
}

/** Short line under “Available · busy now” (visible without hover). */
export function formatLiveWorkInline(live: MachineLiveWork | null | undefined): string | null {
  if (!live?.batchNumber?.trim()) return null;
  const stage = live.stageName?.trim();
  if (live.stepFinished && stage) {
    return `${live.batchNumber} · ${stage} (finished)`;
  }
  return stage ? `${live.batchNumber} · ${stage}` : live.batchNumber;
}

function stepLiveWork(
  batch: ProductionScheduleBatch,
  step: ProductionScheduleBatch['steps'][number],
  stepFinished = false,
): MachineLiveWork {
  return {
    batchNumber: batch.batch_number,
    stageName: step.stage_name,
    stageLogId: step.stage_log_id,
    stepFinished: stepFinished || undefined,
  };
}

/** In-progress batch step on this machine (actual floor occupancy only). */
export function findLiveWorkOnMachine(
  machineId: number,
  scheduleBatches: ProductionScheduleBatch[],
): MachineLiveWork | null {
  for (const batch of scheduleBatches) {
    if (batch.status !== 'in_progress') continue;
    for (const step of batch.steps) {
      if (step.machine_id !== machineId) continue;
      if (step.status !== 'in_progress') continue;
      return stepLiveWork(batch, step);
    }
  }
  return null;
}

export function buildMachineLiveWorkMap(
  scheduleBatches: ProductionScheduleBatch[],
  machineIds?: number[],
): MachineLiveWorkMap {
  const map: MachineLiveWorkMap = {};
  const scanIds =
    machineIds?.length ?
      machineIds
    :
      [
        ...new Set(
          scheduleBatches.flatMap((b) =>
            b.status === 'in_progress' ? b.steps.map((s) => s.machine_id).filter((id): id is number => id != null) : [],
          ),
        ),
      ];
  for (const machineId of scanIds) {
    const work = findLiveWorkOnMachine(machineId, scheduleBatches);
    if (work) map[machineId] = work;
  }
  return map;
}

export type MachineScheduleOccupancy = {
  state: 'free' | 'scheduled';
  batchNumber?: string;
};

export type MachineScheduleOccupancyMap = Record<number, MachineScheduleOccupancy>;

export function buildMachineOccupancyForWindow(
  machineIds: number[],
  window: { plannedStartAt: string; plannedEndAt: string } | null | undefined,
  scheduleBatches: ProductionScheduleBatch[],
  exclude?: { batchId?: number; stageLogId?: number },
): MachineScheduleOccupancyMap | undefined {
  if (!window || machineIds.length === 0) return undefined;
  const start = new Date(window.plannedStartAt).getTime();
  const end = new Date(window.plannedEndAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;

  const allowed = new Set(machineIds);
  const map: MachineScheduleOccupancyMap = {};
  for (const id of machineIds) {
    map[id] = { state: 'free' };
  }

  for (const batch of scheduleBatches) {
    if (exclude?.batchId != null && batch.batch_id === exclude.batchId) continue;
    for (const step of batch.steps) {
      if (exclude?.stageLogId != null && step.stage_log_id === exclude.stageLogId) continue;
      const machineId = step.machine_id;
      if (machineId == null || !allowed.has(machineId)) continue;
      const otherStart = new Date(step.planned_start_at).getTime();
      const otherEnd = new Date(step.planned_end_at).getTime();
      if (!Number.isFinite(otherStart) || !Number.isFinite(otherEnd)) continue;
      if (!rangesOverlap(start, end, otherStart, otherEnd)) continue;
      if (map[machineId].state === 'free') {
        map[machineId] = { state: 'scheduled', batchNumber: batch.batch_number };
      }
    }
  }

  return map;
}
