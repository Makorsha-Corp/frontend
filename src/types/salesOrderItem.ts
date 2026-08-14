export interface SalesOrderItem {
  id: number;
  workspace_id: number;
  sales_order_id: number;
  item_id: number | null;
  description: string | null;
  item_name: string | null;
  item_unit: string | null;
  requires_delivery: boolean;
  quantity_ordered: number;
  quantity_delivered: number;
  quantity_remaining?: number;
  quantity_planned?: number;
  quantity_available_to_plan?: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  fulfillment_completion_code: string | null;
}

export interface CreateSalesOrderItemDTO {
  item_id?: number;
  description?: string;
  quantity_ordered: number;
  unit_price: number;
  requires_delivery: boolean;
  notes?: string;
  // Note: exactly one of item_id (catalog) or description (free-text) must be set.
  // sales_order_id and line_total are added automatically
}

export interface UpdateSalesOrderItemDTO {
  description?: string;
  quantity_ordered?: number;
  quantity_delivered?: number;
  unit_price?: number;
  line_total?: number;
  requires_delivery?: boolean;
  notes?: string;
}
