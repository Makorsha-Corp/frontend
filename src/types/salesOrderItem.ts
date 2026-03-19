export interface SalesOrderItem {
  id: number;
  workspace_id: number;
  sales_order_id: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity_ordered: number;
  quantity_delivered: number;
  quantity_remaining?: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
}

export interface CreateSalesOrderItemDTO {
  item_id: number;
  quantity_ordered: number;
  unit_price: number;
  notes?: string;
  // Note: sales_order_id and line_total are added automatically
}

export interface UpdateSalesOrderItemDTO {
  quantity_ordered?: number;
  quantity_delivered?: number;
  unit_price?: number;
  line_total?: number;
  notes?: string;
}
