/** Item order history — GET /items/{id}/orders/ */

export type ItemOrderType =
  | 'purchase_order'
  | 'transfer_order'
  | 'sales_order'
  | 'work_order';

export interface ItemOrderRow {
  order_type: ItemOrderType;
  order_id: number;
  order_number: string;
  order_date: string | null;
  quantity: number | string;
  unit_price: number | string | null;
  line_total: number | string | null;
  status_name: string | null;
  account_name: string | null;
  created_at: string;
}

export interface ItemOrdersListResponse {
  items: ItemOrderRow[];
  total: number;
}

export interface GetItemOrdersParams {
  itemId: number;
  skip?: number;
  limit?: number;
  order_type?: ItemOrderType;
  from_date?: string;
  to_date?: string;
}
