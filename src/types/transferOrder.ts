export interface TransferOrderItem {
  id: number;
  workspace_id: number;
  transfer_order_id: number;
  line_number: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity: number;
  approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  transferred_by: string | null;
  transferred_at: string | null;
  notes: string | null;
}

export interface TransferOrder {
  id: number;
  workspace_id: number;
  transfer_number: string;
  source_location_type: string;
  source_location_id: number;
  destination_location_type: string;
  destination_location_id: number;
  current_status_id: number;
  current_status_name: string | null;
  required_approvals: number | null;
  order_completed: boolean;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  completed_by: number | null;
  completed_at: string | null;
}

export interface CreateTransferOrderItem {
  item_id: number;
  quantity: number;
  notes?: string | null;
}

export interface CreateTransferOrder {
  source_location_type: string;
  source_location_id: number;
  destination_location_type: string;
  destination_location_id: number;
  description?: string | null;
  current_status_id?: number;
  items?: CreateTransferOrderItem[];
}

export interface UpdateTransferOrder {
  source_location_type?: string;
  source_location_id?: number;
  destination_location_type?: string;
  destination_location_id?: number;
  current_status_id?: number | null;
  required_approvals?: number | null;
  description?: string | null;
}

export interface UpdateTransferOrderItem {
  quantity?: number | null;
  approved?: boolean | null;
  transferred_by?: string | null;
  transferred_at?: string | null;
  notes?: string | null;
}

export interface ListTransferOrdersParams {
  skip?: number;
  limit?: number;
}

export interface TransferOrderApprover {
  id: number;
  workspace_id: number;
  transfer_order_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
  approved: boolean;
  approved_at: string | null;
}

export interface TransferApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface TransferOrderApproversList {
  approvers: TransferOrderApprover[];
  summary: TransferApprovalSummary;
}

export interface TransferOrderEventChange {
  field: string;
  label: string;
  from_value?: string | null;
  to_value?: string | null;
}

export interface TransferOrderEventMetadata {
  changes?: TransferOrderEventChange[];
  user_id?: number;
  user_name?: string | null;
  lines_posted?: number;
}

export interface TransferOrderEvent {
  id: number;
  workspace_id: number;
  transfer_order_id: number;
  event_type: string;
  description: string;
  metadata?: TransferOrderEventMetadata | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
}
