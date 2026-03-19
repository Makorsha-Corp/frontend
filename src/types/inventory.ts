/**
 * Unified inventory types (STORAGE, DAMAGED, WASTE, SCRAP)
 */

export type InventoryType = 'STORAGE' | 'DAMAGED' | 'WASTE' | 'SCRAP';

export interface Inventory {
  id: number;
  workspace_id: number;
  item_id: number;
  item_name?: string | null;
  item_unit?: string | null;
  inventory_type: InventoryType;
  factory_id: number;
  qty: number;
  avg_price: number | null;
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

export interface CreateInventoryRequest {
  item_id: number;
  inventory_type: InventoryType;
  factory_id: number;
  qty?: number;
  avg_price?: number;
  note?: string;
}

export interface UpdateInventoryRequest {
  qty?: number;
  avg_price?: number;
  note?: string;
}

export interface ListInventoryParams {
  skip?: number;
  limit?: number;
  inventory_type?: InventoryType;
  factory_id?: number;
}

export interface InventoryLedgerEntry {
  id: number;
  workspace_id: number;
  inventory_type: InventoryType;
  factory_id: number;
  item_id: number;
  transaction_type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  qty_before: number;
  qty_after: number;
  avg_price_before: number | null;
  avg_price_after: number | null;
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

export interface ListInventoryLedgerParams {
  skip?: number;
  limit?: number;
  inventory_type?: InventoryType;
  factory_id?: number;
  item_id?: number;
}
