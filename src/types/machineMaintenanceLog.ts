/**
 * Machine maintenance log types
 */

export type MaintenanceType = 'PREVENTIVE' | 'REPAIR' | 'EMERGENCY' | 'INSPECTION';

export interface MachineMaintenanceLog {
  id: number;
  workspace_id: number;
  machine_id: number;
  maintenance_type: MaintenanceType;
  maintenance_date: string;
  summary: string;
  cost: number | null;
  performed_by: string | null;

  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;

  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface CreateMachineMaintenanceLogRequest {
  machine_id: number;
  maintenance_type: MaintenanceType;
  maintenance_date: string;
  summary: string;
  cost?: number;
  performed_by?: string;
}

export interface UpdateMachineMaintenanceLogRequest {
  maintenance_type?: MaintenanceType;
  maintenance_date?: string;
  summary?: string;
  cost?: number;
  performed_by?: string;
}

export interface ListMachineMaintenanceLogsParams {
  skip?: number;
  limit?: number;
  machine_id?: number;
  maintenance_type?: MaintenanceType;
}
