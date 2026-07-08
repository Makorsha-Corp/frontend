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
  unit_price: number | null;
  line_subtotal: number | null;
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
  current_status_name: string | null;
  order_workflow_id: number | null;
  invoice_id: number | null;
  required_approvals: number | null;
  description: string | null;
  supplier_confirmed: boolean;
  details_confirmed: boolean;
  items_confirmed: boolean;
  invoice_confirmed: boolean;
  order_completed?: boolean;
  voided: boolean;
  invoice_ever_linked: boolean;
  paid: boolean;
  void_note: string | null;
  voided_at: string | null;
  voided_by: number | null;
  invoice_payment_status: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  items_updated_at: string | null;
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
  | 'items_confirmed'
  | 'items_unconfirmed'
  | 'invoice_confirmed'
  | 'invoice_unconfirmed'
  | 'invoice_created'
  | 'invoice_voided'
  | 'invoice_draft_created'
  | 'approvals_reset'
  | 'supplier_updated'
  | 'details_updated'
  | 'item_added'
  | 'item_removed'
  | 'item_updated'
  | 'approver_added'
  | 'approver_removed'
  | 'status_updated'
  | 'order_completed'
  | 'inventory_posted'
  | 'approvals_threshold_updated'
  | 'po_voided'
  | 'quantity_correction';

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
  invoice_id?: number;
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
  unit_price?: number | null;
  notes?: string | null;
}

export interface CreatePurchaseOrder {
  account_id?: number | null;
  destination_type: string;
  destination_id: number;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  description?: string | null;
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
  supplier_confirmed?: boolean;
  details_confirmed?: boolean;
  items_confirmed?: boolean;
}

export interface UpdatePurchaseOrderItem {
  quantity_ordered?: number | null;
  quantity_received?: number | null;
  unit_price?: number | null;
  notes?: string | null;
}

export interface PurchaseOrderItemSyncUpdate {
  id: number;
  quantity_ordered: number;
  unit_price: number | null;
}

export interface PurchaseOrderItemSyncRequest {
  remove_ids: number[];
  updates: PurchaseOrderItemSyncUpdate[];
  additions: CreatePurchaseOrderItem[];
}

export interface PoReceiveEventItem {
  id: number;
  receive_event_id: number;
  po_item_id: number;
  po_item_name: string | null;
  po_item_unit: string | null;
  quantity_delta: number;
}

export interface PoReceiveEvent {
  id: number;
  workspace_id: number;
  purchase_order_id: number;
  event_type: 'receive' | 'correction';
  rcc: string | null;
  received_by: string | null;
  correction_note: string | null;
  performed_by: number | null;
  performer_name: string | null;
  created_at: string;
  items: PoReceiveEventItem[];
}

export interface PoReceiveEventItemCreate {
  po_item_id: number;
  quantity_delta: number;
}

export interface PoReceiveEventCreate {
  event_type: 'receive' | 'correction';
  rcc?: string | null;
  received_by?: string | null;
  correction_note?: string | null;
  items: PoReceiveEventItemCreate[];
}

export interface ListPurchaseOrdersParams {
  skip?: number;
  limit?: number;
  account_id?: number;
  invoice_id?: number;
}

export type ActiveOrderKind = 'purchase' | 'transfer' | 'work';

export interface ActiveOrderRow {
  order_kind: ActiveOrderKind;
  id: number;
  number: string;
  summary: string | null;
  // Work orders don't use the generic statuses table — this is null for them,
  // with status_name carrying their plain status label instead.
  current_status_id: number | null;
  status_name: string | null;
  created_at: string;
  total_amount: string | null;
}

/** Exactly one key — matches GET /purchase-orders/active/ */
export type ActiveOrdersScope =
  | { machineId: number }
  | { factoryId: number }
  | { projectComponentId: number };
