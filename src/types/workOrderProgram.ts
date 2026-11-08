import type { WorkOrderSheetApproverLine, WorkOrderSheetEntryLine } from './workOrderSheet';
import type { WorkOrderPriority } from './workOrder';

export interface WorkOrderProgramOccurrence {
  work_order_id: number;
  work_order_number: string;
  status: string;
  planned_date: string | null;
}

export interface WorkOrderProgram {
  id: number;
  workspace_id: number;
  factory_id: number;
  machine_id: number;
  work_order_type_id: number;
  title: string;
  work_order_template_id: number | null;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval_days: number | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'stopped';
  created_by: number | null;
  created_at: string;
  work_order_count: number;
  shift_id?: number | null;
  planned_start_time?: string | null;
  expected_duration_minutes?: number | null;
  occurrences?: WorkOrderProgramOccurrence[];
}

export interface CreateWorkOrderProgramRequest {
  machine_id: number;
  work_order_type_id: number;
  planned_date: string;
  end_date: string;
  shift_id?: number | null;
  planned_start_time?: string | null;
  expected_duration_minutes?: number | null;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval_days?: number;
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  assigned_to?: string;
  account_id?: number;
  cost?: number;
  template_id?: number;
  items?: WorkOrderSheetEntryLine[];
  approvers?: WorkOrderSheetApproverLine[];
}
