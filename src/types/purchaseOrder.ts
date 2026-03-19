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
  account_id: number;
  destination_type: string;
  destination_id: number;
  subtotal: number;
  total_amount: number;
  current_status_id: number;
  order_workflow_id: number | null;
  invoice_id: number | null;
  description: string | null;
  order_note: string | null;
  internal_note: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface CreatePurchaseOrderItem {
  item_id: number;
  quantity_ordered: number;
  unit_price: number;
  notes?: string | null;
}

export interface CreatePurchaseOrder {
  account_id: number;
  destination_type: string;
  destination_id: number;
  description?: string | null;
  order_note?: string | null;
  internal_note?: string | null;
  current_status_id?: number;
  order_workflow_id?: number | null;
  items?: CreatePurchaseOrderItem[];
}

export interface UpdatePurchaseOrder {
  account_id?: number | null;
  current_status_id?: number | null;
  invoice_id?: number | null;
  description?: string | null;
  order_note?: string | null;
  internal_note?: string | null;
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
}
