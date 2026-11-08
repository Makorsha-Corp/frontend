import type { Machine } from '@/types/machine';
import type { MachineScheduleOccupancy } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import { getMachineStatusLabel } from '@/lib/machineVisualStatus';
import {
  plannedWindowIncludesNow,
  resolveMachinePickerTileDisplay,
} from '@/lib/machinePickerAvailability';

/** Floor status when batch picker has no planned window. */
export function formatMachineTileSubtext(
  machine: Machine,
  scheduleOccupancy?: MachineScheduleOccupancy,
  options?: {
    hasPlannedWindow?: boolean;
    plannedWindow?: { plannedStartAt: string; plannedEndAt: string } | null;
    windowIncludesNow?: boolean;
  },
): string {
  const hasPlannedWindow = options?.hasPlannedWindow ?? scheduleOccupancy != null;
  const windowIncludesNow =
    options?.windowIncludesNow ??
    (hasPlannedWindow
      ? plannedWindowIncludesNow(options?.plannedWindow ?? null)
      : plannedWindowIncludesNow(undefined));

  const picker = resolveMachinePickerTileDisplay(
    machine,
    scheduleOccupancy,
    hasPlannedWindow,
    windowIncludesNow,
  );
  if (picker) return picker.subtext;
  return getMachineStatusLabel(machine);
}
