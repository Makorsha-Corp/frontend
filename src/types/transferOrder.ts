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
  order_date: string;
  current_status_id: number;
  description: string | null;
  note: string | null;
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
  order_date?: string | null;
  description?: string | null;
  note?: string | null;
  current_status_id?: number;
  items?: CreateTransferOrderItem[];
}

export interface UpdateTransferOrder {
  current_status_id?: number | null;
  description?: string | null;
  note?: string | null;
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
