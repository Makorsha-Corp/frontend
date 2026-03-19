/**
 * Product types (finished goods)
 */

export interface Product {
  id: number;
  workspace_id: number;
  item_id: number;
  item_name?: string | null;
  item_unit?: string | null;
  factory_id: number;
  qty: number;
  avg_cost: number | null;
  selling_price: number | null;
  min_order_qty: number | null;
  is_available_for_sale: boolean;
  note: string | null;

  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;

  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface CreateProductRequest {
  item_id: number;
  factory_id: number;
  qty?: number;
  avg_cost?: number;
  selling_price?: number;
  min_order_qty?: number;
  is_available_for_sale?: boolean;
  note?: string;
}

export interface UpdateProductRequest {
  qty?: number;
  avg_cost?: number;
  selling_price?: number;
  min_order_qty?: number;
  is_available_for_sale?: boolean;
  note?: string;
}

export interface ListProductsParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  is_available_for_sale?: boolean;
}

export interface ProductLedgerEntry {
  id: number;
  workspace_id: number;
  factory_id: number;
  item_id: number;
  transaction_type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  qty_before: number;
  qty_after: number;
  avg_cost_before: number | null;
  avg_cost_after: number | null;
  source_type: string | null;
  source_id: number | null;
  transfer_source_type: string | null;
  transfer_source_id: number | null;
  transfer_destination_type: string | null;
  transfer_destination_id: number | null;
  notes: string | null;
  performed_by: number | null;
  performed_at: string;
}

export interface ListProductLedgerParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  item_id?: number;
}
