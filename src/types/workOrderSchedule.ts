import type { WorkOrderPriority } from './workOrder';

export type WorkOrderScheduleStatus = 'STAGED' | 'CONFIRMED' | 'CANCELLED';

export interface WorkOrderSchedule {
  id: number;
  workspace_id: number;
  scheduled_date: string;
  status: WorkOrderScheduleStatus;
  work_order_template_id: number | null;
  template_name: string | null;
  machine_id: number;
  machine_name: string | null;
  factory_id: number;
  factory_section_id: number | null;
  work_order_type_id: number;
  work_order_type_name: string | null;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  work_order_id: number | null;
  confirmed_at: string | null;
  confirmed_by: number | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  created_at: string;
  created_by: number | null;
}

export interface StageWorkOrderDayRequest {
  target_date: string;
  factory_section_id?: number;
  factory_id?: number;
}

export interface ListWorkOrderSchedulesParams {
  factory_id?: number;
  machine_id?: number;
  start_date_from?: string;
  start_date_to?: string;
  status?: WorkOrderScheduleStatus;
  skip?: number;
  limit?: number;
}
