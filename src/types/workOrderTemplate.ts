import type { WorkOrderItemActionType, WorkOrderPriority } from './workOrder';

export interface WorkOrderTemplateItem {
  id: number;
  workspace_id: number;
  work_order_template_id: number;
  item_id: number;
  item_name: string | null;
  quantity: number;
  action_type: WorkOrderItemActionType;
  replaced_item_id: number | null;
  replaced_item_name: string | null;
  notes: string | null;
}

export interface WorkOrderTemplate {
  id: number;
  workspace_id: number;
  template_name: string;
  description: string | null;
  work_order_type_id: number;
  work_order_type_name: string | null;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  uses_inventory: boolean;
  account_id: number | null;
  cost: number | null;
  requires_approval: boolean;
  notes: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface WorkOrderTemplateApprover {
  id: number;
  workspace_id: number;
  work_order_template_id: number;
  user_id: number;
  user_name: string | null;
}

export interface CreateWorkOrderTemplateItem {
  item_id: number;
  quantity?: number;
  action_type?: WorkOrderItemActionType;
  replaced_item_id?: number;
  notes?: string;
}

export interface CreateWorkOrderTemplate {
  template_name: string;
  description?: string;
  work_order_type_id: number;
  priority?: WorkOrderPriority;
  assigned_to?: string;
  uses_inventory?: boolean;
  account_id?: number;
  cost?: number;
  requires_approval?: boolean;
  notes?: string;
  items?: CreateWorkOrderTemplateItem[];
  approver_user_ids?: number[];
}

export interface UpdateWorkOrderTemplate {
  template_name?: string;
  description?: string;
  work_order_type_id?: number;
  priority?: WorkOrderPriority;
  assigned_to?: string;
  uses_inventory?: boolean;
  account_id?: number;
  cost?: number;
  requires_approval?: boolean;
  notes?: string;
  is_active?: boolean;
  approver_user_ids?: number[];
}

export interface UpdateWorkOrderTemplateItem {
  quantity?: number;
  action_type?: WorkOrderItemActionType;
  replaced_item_id?: number;
  notes?: string;
}

export interface ListWorkOrderTemplatesParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  work_order_type_id?: number;
}

export interface CreateWorkOrderFromTemplate {
  machine_id: number;
  title?: string;
  description?: string;
  assigned_to?: string;
}
