import type { WorkOrderCompleteRequest } from '@/types/workOrder';

export function buildWorkOrderCompletePayload(input: {
  notes: string;
  machineStatus: 'IDLE' | 'OFF' | '';
  hasMachineTarget: boolean;
  completedByNames: string;
  completedByUserIds: number[];
}): WorkOrderCompleteRequest {
  const names = input.completedByNames.trim();
  return {
    completion_notes: input.notes.trim() || undefined,
    machine_status: input.hasMachineTarget ? (input.machineStatus as 'IDLE' | 'OFF') : undefined,
    completed_by_names: names || undefined,
    completed_by_user_ids: input.completedByUserIds.length ? input.completedByUserIds : undefined,
  };
}
