/**
 * Work order types
 */

export type WorkType = 'MAINTENANCE' | 'INSPECTION' | 'INSTALLATION' | 'REPAIR' | 'CALIBRATION' | 'OVERHAUL' | 'FABRICATION' | 'OTHER';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrder {
  id: number;
  workspace_id: number;
  work_order_number: string;
  work_type: WorkType;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  factory_id: number;
  machine_id: number | null;
  project_component_id: number | null;
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  assigned_to: string | null;

  order_approved: boolean;
  order_approved_by: number | null;
  order_approved_at: string | null;
  cost_approved: boolean;
  cost_approved_by: number | null;
  cost_approved_at: string | null;

  notes: string | null;
  completion_notes: string | null;

  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;

  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface CreateWorkOrderRequest {
  work_type: WorkType;
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  factory_id: number;
  machine_id?: number;
  project_component_id?: number;
  start_date?: string;
  end_date?: string;
  cost?: number;
  assigned_to?: string;
  notes?: string;
}

export interface UpdateWorkOrderRequest {
  work_type?: WorkType;
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  machine_id?: number;
  project_component_id?: number;
  start_date?: string;
  end_date?: string;
  cost?: number;
  assigned_to?: string;
  order_approved?: boolean;
  cost_approved?: boolean;
  notes?: string;
  completion_notes?: string;
}

export interface ListWorkOrdersParams {
  skip?: number;
  limit?: number;
  work_type?: WorkType;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  factory_id?: number;
  machine_id?: number;
}

export interface WorkOrderItem {
  id: number;
  workspace_id: number;
  work_order_id: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity: number;
  notes: string | null;
  created_at: string;
  created_by: number | null;
}

export interface CreateWorkOrderItemRequest {
  work_order_id: number;
  item_id: number;
  quantity: number;
  notes?: string;
}

export interface UpdateWorkOrderItemRequest {
  quantity?: number;
  notes?: string;
}
