import type { MachineLiveWork } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import type { MachineScheduleOccupancy } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import type { Machine } from '@/types/machine';
import { getMachineVisualKind } from '@/lib/machineVisualStatus';
import { hasScheduleBooking } from '@/lib/machinePickerAvailability';
import type { WorkspaceSettings } from '@/types/workspace';

export type ProductionMachinePickPolicy = 'soft' | 'block_unavailable' | 'block_overlap';

export type MachinePickWarningReason = 'maintenance' | 'off' | 'occupied' | 'schedule_overlap';

export interface MachinePickEvaluation {
  blocked: boolean;
  warnings: MachinePickWarningReason[];
}

export interface MachinePickContext {
  /** False when no planned window was computed for this pick. */
  hasPlannedWindow?: boolean;
  plannedWindow?: { plannedStartAt: string; plannedEndAt: string } | null;
  windowIncludesNow?: boolean;
  /** Live in-progress step on this machine (from schedule). */
  liveWorkOnMachine?: MachineLiveWork | null;
  /** Stage log being assigned; exempt from live-step conflict. */
  excludeStageLogId?: number;
}

const POLICY_VALUES: ProductionMachinePickPolicy[] = ['soft', 'block_unavailable', 'block_overlap'];

export function parseProductionMachinePickPolicy(
  settings?: WorkspaceSettings | Record<string, unknown> | null,
): ProductionMachinePickPolicy {
  const raw = settings?.production_machine_pick_policy;
  if (typeof raw === 'string' && POLICY_VALUES.includes(raw as ProductionMachinePickPolicy)) {
    return raw as ProductionMachinePickPolicy;
  }
  return 'soft';
}

export function hasLiveStepConflictOnMachine(
  liveWork: MachineLiveWork | null | undefined,
  excludeStageLogId?: number,
): boolean {
  if (!liveWork?.batchNumber?.trim()) return false;
  if (
    excludeStageLogId != null &&
    liveWork.stageLogId != null &&
    liveWork.stageLogId === excludeStageLogId
  ) {
    return false;
  }
  return true;
}

export function machinePickWarningLabel(reason: MachinePickWarningReason): string {
  switch (reason) {
    case 'maintenance':
      return 'Machine is in maintenance';
    case 'off':
      return 'Machine is off / not available';
    case 'occupied':
      return 'Another step is in progress on this machine';
    case 'schedule_overlap':
      return 'Another batch is planned on this machine in this window';
    default:
      return reason;
  }
}

/** Start step: planned overlap is informational on tiles only — not a start confirm. */
export function warningsForStartStepConfirm(
  warnings: MachinePickWarningReason[],
): MachinePickWarningReason[] {
  return warnings.filter((reason) => reason !== 'schedule_overlap');
}

export function evaluateMachinePick(
  machine: Machine,
  policy: ProductionMachinePickPolicy,
  scheduleOccupancy?: MachineScheduleOccupancy,
  pickContext?: MachinePickContext,
): MachinePickEvaluation {
  const kind = getMachineVisualKind(machine);

  const warnings: MachinePickWarningReason[] = [];
  if (kind === 'maintenance') warnings.push('maintenance');
  if (kind === 'off') warnings.push('off');
  if (hasScheduleBooking(scheduleOccupancy)) {
    warnings.push('schedule_overlap');
  }
  if (
    hasLiveStepConflictOnMachine(
      pickContext?.liveWorkOnMachine,
      pickContext?.excludeStageLogId,
    )
  ) {
    warnings.push('occupied');
  }

  let blocked = false;
  if (policy === 'block_unavailable' || policy === 'block_overlap') {
    if (kind === 'maintenance' || kind === 'off') blocked = true;
  }
  if (policy === 'block_overlap' && warnings.includes('occupied')) {
    blocked = true;
  }

  return { blocked, warnings };
}
