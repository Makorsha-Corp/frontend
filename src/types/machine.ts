/**
 * Machine types
 */

export interface Machine {
  id: number;
  workspace_id: number;
  name: string;
  is_running: boolean;
  factory_section_id: number;

  // Metadata
  model_number: string | null;
  manufacturer: string | null;
  next_maintenance_schedule: string | null;
  next_maintenance_note: string | null;
  note: string | null;

  // Audit
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;

  // Soft delete
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface CreateMachineRequest {
  name: string;
  factory_section_id: number;
  model_number?: string;
  manufacturer?: string;
  next_maintenance_schedule?: string;
  next_maintenance_note?: string;
  note?: string;
}

export interface UpdateMachineRequest {
  name?: string;
  factory_section_id?: number;
  model_number?: string;
  manufacturer?: string;
  next_maintenance_schedule?: string;
  next_maintenance_note?: string;
  note?: string;
}

export interface ListMachinesParams {
  skip?: number;
  limit?: number;
  factory_section_id?: number;
  is_running?: boolean;
  search?: string;
}

export type MachineEventType = 'IDLE' | 'RUNNING' | 'OFF' | 'MAINTENANCE';

export interface MachineEvent {
  id: number;
  workspace_id: number;
  machine_id: number;
  event_type: MachineEventType;
  started_at: string;
  initiated_by: number | null;
  note: string | null;
  created_at: string;
  created_by: number | null;
}

export interface CreateMachineEventRequest {
  machine_id: number;
  event_type: MachineEventType;
  note?: string;
}

export interface ListMachineEventsParams {
  machine_id: number;
  event_type?: MachineEventType;
  skip?: number;
  limit?: number;
}
