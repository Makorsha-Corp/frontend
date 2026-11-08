import type { MachineLiveWork } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import { formatBusyNowTooltip } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import type { MachineScheduleOccupancy } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import type { Machine } from '@/types/machine';
import { getMachineStatusLabel, getMachineVisualKind } from '@/lib/machineVisualStatus';

export type PickerAvailabilityBucket =
  | 'available'
  | 'available_busy_now'
  | 'occupied'
  | 'unavailable';

export interface MachinePickerTileDisplay {
  bucket: PickerAvailabilityBucket;
  subtext: string;
  /** Native tooltip on status line (e.g. busy-now batch). */
  subtextTitle?: string;
  topBarClass: string;
  subtextClass: string;
  borderRingClass: string;
}

const OPEN_TOP_BAR = 'bg-emerald-500';
const OPEN_SUBTEXT = 'text-emerald-700 dark:text-emerald-400';
const OPEN_BORDER = 'border-emerald-500/25 ring-1 ring-emerald-500/10';

const OCCUPIED_TOP_BAR = 'bg-amber-500';
const OCCUPIED_SUBTEXT = 'text-amber-800 dark:text-amber-400';
const OCCUPIED_BORDER = 'border-amber-500/30 ring-1 ring-amber-500/10';

export function plannedWindowIncludesNow(
  window: { plannedStartAt: string; plannedEndAt: string } | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!window) return true;
  const start = new Date(window.plannedStartAt).getTime();
  const end = new Date(window.plannedEndAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
  return nowMs >= start && nowMs < end;
}

export function hasScheduleBooking(
  scheduleOccupancy: MachineScheduleOccupancy | undefined,
): boolean {
  return scheduleOccupancy?.state === 'scheduled';
}

/** Planned-window booking (forecast overlap), not live floor occupancy. */
export function isMachinePickOccupied(
  scheduleOccupancy: MachineScheduleOccupancy | undefined,
): boolean {
  return hasScheduleBooking(scheduleOccupancy);
}

/** Batch step picker tiles; null = use floor status only (no planned window). */
export function resolveMachinePickerTileDisplay(
  machine: Machine,
  scheduleOccupancy: MachineScheduleOccupancy | undefined,
  hasPlannedWindow: boolean,
  _windowIncludesNow: boolean,
  liveWork?: MachineLiveWork | null,
): MachinePickerTileDisplay | null {
  if (!hasPlannedWindow) return null;

  const kind = getMachineVisualKind(machine);
  if (kind === 'maintenance' || kind === 'off') {
    return {
      bucket: 'unavailable',
      subtext: getMachineStatusLabel(machine),
      topBarClass:
        kind === 'maintenance' ? 'bg-amber-500' : 'bg-red-500',
      subtextClass:
        kind === 'maintenance'
          ? 'text-amber-800 dark:text-amber-400'
          : 'text-red-700 dark:text-red-400',
      borderRingClass:
        kind === 'maintenance'
          ? 'border-amber-500/30 ring-1 ring-amber-500/10'
          : 'border-red-500/25 ring-1 ring-red-500/10',
    };
  }

  if (hasScheduleBooking(scheduleOccupancy)) {
    const batch = scheduleOccupancy?.batchNumber?.trim();
    const subtext = batch ? `Planned · ${batch}` : 'Planned';
    return {
      bucket: 'occupied',
      subtext,
      topBarClass: OCCUPIED_TOP_BAR,
      subtextClass: OCCUPIED_SUBTEXT,
      borderRingClass: OCCUPIED_BORDER,
    };
  }

  if (liveWork?.batchNumber?.trim()) {
    const stage = liveWork.stageName?.trim();
    const subtext = stage ? `In production · ${stage}` : 'In production';
    return {
      bucket: 'occupied',
      subtext,
      subtextTitle: formatBusyNowTooltip(liveWork),
      topBarClass: OCCUPIED_TOP_BAR,
      subtextClass: OCCUPIED_SUBTEXT,
      borderRingClass: OCCUPIED_BORDER,
    };
  }

  if (kind === 'running') {
    return {
      bucket: 'available_busy_now',
      subtext: 'Available · busy now',
      subtextTitle: formatBusyNowTooltip(liveWork ?? undefined),
      topBarClass: OPEN_TOP_BAR,
      subtextClass: OPEN_SUBTEXT,
      borderRingClass: OPEN_BORDER,
    };
  }

  return {
    bucket: 'available',
    subtext: 'Available',
    topBarClass: OPEN_TOP_BAR,
    subtextClass: OPEN_SUBTEXT,
    borderRingClass: OPEN_BORDER,
  };
}
