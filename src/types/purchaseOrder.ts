export interface PurchaseOrderItem {
  id: number;
  workspace_id: number;
  purchase_order_id: number;
  line_number: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_subtotal: number;
  notes: string | null;
}

export interface PurchaseOrder {
  id: number;
  workspace_id: number;
  po_number: string;
  account_id: number | null;
  destination_type: string;
  destination_id: number;
  order_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  subtotal: number;
  total_amount: number;
  current_status_id: number;
  order_workflow_id: number | null;
  invoice_id: number | null;
  required_approvals: number | null;
  description: string | null;
  order_note: string | null;
  supplier_confirmed: boolean;
  details_confirmed: boolean;
  notes_confirmed: boolean;
  items_confirmed: boolean;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface PurchaseOrderApprover {
  id: number;
  workspace_id: number;
  purchase_order_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
  approved: boolean;
  approved_at: string | null;
}

export interface ApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface PurchaseOrderApproversList {
  approvers: PurchaseOrderApprover[];
  summary: ApprovalSummary;
}

export type PurchaseOrderEventType =
  | 'created'
  | 'received'
  | 'all_received'
  | 'approved'
  | 'approval_withdrawn'
  | 'supplier_confirmed'
  | 'supplier_unconfirmed'
  | 'details_confirmed'
  | 'details_unconfirmed'
  | 'notes_confirmed'
  | 'notes_unconfirmed'
  | 'items_confirmed'
  | 'items_unconfirmed'
  | 'invoice_created'
  | 'supplier_updated'
  | 'details_updated'
  | 'notes_updated'
  | 'item_added'
  | 'item_removed'
  | 'item_updated'
  | 'approver_added'
  | 'approver_removed'
  | 'status_updated'
  | 'approvals_threshold_updated';

export interface PurchaseOrderEventChange {
  field: string;
  label: string;
  from_value: string | null;
  to_value: string | null;
}

export interface PurchaseOrderEventMetadata {
  changes?: PurchaseOrderEventChange[];
  item_id?: number;
  item_name?: string;
  line_number?: number;
  quantity_ordered?: string;
  unit_price?: string;
  user_id?: number;
  user_name?: string;
}

export interface PurchaseOrderEvent {
  id: number;
  workspace_id: number;
  purchase_order_id: number;
  event_type: PurchaseOrderEventType | string;
  description: string;
  metadata?: PurchaseOrderEventMetadata | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
}

export interface CreatePurchaseOrderItem {
  item_id: number;
  quantity_ordered: number;
  unit_price: number;
  notes?: string | null;
}

export interface CreatePurchaseOrder {
  account_id?: number | null;
  destination_type: string;
  destination_id: number;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  description?: string | null;
  order_note?: string | null;
  current_status_id?: number;
  order_workflow_id?: number | null;
  items?: CreatePurchaseOrderItem[];
}

export interface UpdatePurchaseOrder {
  account_id?: number | null;
  destination_type?: string | null;
  destination_id?: number | null;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  current_status_id?: number | null;
  invoice_id?: number | null;
  required_approvals?: number | null;
  description?: string | null;
  order_note?: string | null;
  supplier_confirmed?: boolean;
  details_confirmed?: boolean;
  notes_confirmed?: boolean;
  items_confirmed?: boolean;
}

export interface UpdatePurchaseOrderItem {
  quantity_ordered?: number | null;
  quantity_received?: number | null;
  unit_price?: number | null;
  notes?: string | null;
}

export interface ListPurchaseOrdersParams {
  skip?: number;
  limit?: number;
  account_id?: number;
  invoice_id?: number;
}

export type ActiveOrderKind = 'purchase' | 'transfer';

export interface ActiveOrderRow {
  order_kind: ActiveOrderKind;
  id: number;
  number: string;
  summary: string | null;
  current_status_id: number;
  status_name: string | null;
  created_at: string;
  total_amount: string | null;
}

/** Exactly one key — matches GET /purchase-orders/active/ */
export type ActiveOrdersScope =
  | { machineId: number }
  | { factoryId: number }
  | { projectComponentId: number };
