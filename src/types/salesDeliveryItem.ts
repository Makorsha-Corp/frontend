export interface SalesDeliveryItem {
  id: number;
  workspace_id: number;
  delivery_id: number;
  sales_order_item_id: number;
  item_id: number;
  quantity_delivered: number;
  notes: string | null;
}

export interface CreateSalesDeliveryItemDTO {
  sales_order_item_id: number;
  quantity_delivered: number;
  notes?: string;
  // Note: delivery_id and item_id are added automatically by the backend
  // item_id is derived from the sales_order_item
}

export interface UpdateSalesDeliveryItemDTO {
  quantity_delivered?: number;
  notes?: string;
}
