/**
 * Work order types
 */

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
/** Approval (if any approvers are assigned) gates the DRAFT -> IN_PROGRESS transition
 * rather than being its own visible status — see WorkOrderApprovalSummary.met. */
export type WorkOrderStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED';
export type WorkOrderItemSourceType = 'storage' | 'machine';
export type WorkOrderItemActionType = 'CONSUME' | 'INSTALL' | 'REPLACE' | 'BORROW';

export interface WorkOrder {
  id: number;
  workspace_id: number;
  work_order_number: string;
  work_order_type_id: number;
  work_order_type_name: string | null;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  factory_id: number;
  machine_id: number | null;
  project_component_id: number | null;
  start_date: string | null;
  end_date: string | null;
  uses_inventory: boolean;
  cost: number | null;
  account_id: number | null;
  invoice_id: number | null;
  assigned_to: string | null;

  required_approvals: number | null;
  approved_by: number | null;
  approved_at: string | null;

  started_by: number | null;
  started_at: string | null;
  completed_by: number | null;
  completed_at: string | null;

  void_note: string | null;
  voided_at: string | null;
  voided_by: number | null;

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
  work_order_type_id: number;
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  factory_id: number;
  machine_id?: number;
  project_component_id?: number;
  start_date?: string;
  end_date?: string;
  uses_inventory?: boolean;
  cost?: number;
  account_id?: number;
  assigned_to?: string;
}

export interface UpdateWorkOrderRequest {
  work_order_type_id?: number;
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  /** Mutually exclusive with project_component_id — setting one (even to null) clears the other. */
  machine_id?: number | null;
  /** Mutually exclusive with machine_id — setting one (even to null) clears the other. */
  project_component_id?: number | null;
  start_date?: string;
  end_date?: string;
  cost?: number;
  /** Clearing to null reverts to internal/free work (no external billing). */
  account_id?: number | null;
  assigned_to?: string;
  /** Clearing to null reverts to "all assigned approvers required". */
  required_approvals?: number | null;
  completion_notes?: string;
}

export interface ListWorkOrdersParams {
  skip?: number;
  limit?: number;
  work_order_type_id?: number;
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

  uses_inventory: boolean;
  source_location_type: WorkOrderItemSourceType | null;
  source_location_id: number | null;
  action_type: WorkOrderItemActionType;
  replaced_item_id: number | null;
  replaced_item_name: string | null;

  consumed_at: string | null;
  consumed_by: number | null;
  unit_cost: number | null;
  total_cost: number | null;

  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
}

export interface CreateWorkOrderItemRequest {
  work_order_id: number;
  item_id: number;
  quantity: number;
  notes?: string;
  uses_inventory?: boolean;
  source_location_type?: WorkOrderItemSourceType;
  source_location_id?: number;
  action_type?: WorkOrderItemActionType;
  replaced_item_id?: number;
}

export interface UpdateWorkOrderItemRequest {
  quantity?: number;
  notes?: string;
  uses_inventory?: boolean;
  source_location_type?: WorkOrderItemSourceType;
  source_location_id?: number;
}

export interface WorkOrderVoidRequest {
  void_note: string;
}

export interface WorkOrderCompleteRequest {
  completion_notes?: string;
  /** When the order targets a machine, choose what state to leave it in. */
  machine_status?: 'IDLE' | 'RUNNING';
}

export interface WorkOrderApprover {
  id: number;
  workspace_id: number;
  work_order_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
  approved: boolean;
  approved_at: string | null;
}

export interface WorkOrderApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface WorkOrderApproversList {
  approvers: WorkOrderApprover[];
  summary: WorkOrderApprovalSummary;
}

export interface WorkOrderEvent {
  id: number;
  workspace_id: number;
  work_order_id: number;
  event_type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
}
