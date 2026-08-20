import type { MachineEventType } from '@/types/machine';
import type { MachineVisualKind } from '@/lib/machineVisualStatus';

/** Floor meaning for each machine activity status. */
export const MACHINE_EVENT_STATUS_TOOLTIPS: Record<MachineEventType, string> = {
  IDLE: 'Powered and standing by — ready when needed.',
  RUNNING: 'Actively running. Set manually; production batches will drive this when live.',
  OFF: 'Shut down — not available for work.',
  MAINTENANCE: 'Under maintenance — not available until service is finished.',
};

export function machineVisualKindTooltip(kind: MachineVisualKind): string {
  switch (kind) {
    case 'running':
      return MACHINE_EVENT_STATUS_TOOLTIPS.RUNNING;
    case 'idle':
      return MACHINE_EVENT_STATUS_TOOLTIPS.IDLE;
    case 'off':
      return MACHINE_EVENT_STATUS_TOOLTIPS.OFF;
    case 'maintenance':
      return MACHINE_EVENT_STATUS_TOOLTIPS.MAINTENANCE;
  }
}
