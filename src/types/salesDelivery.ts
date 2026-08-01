export interface SalesDelivery {
  id: number;
  workspace_id: number;
  delivery_number: string;
  sales_order_id: number;
  scheduled_date: string | null;
  actual_delivery_date: string | null;
  delivery_status: 'planned' | 'delivered' | 'cancelled';
  tracking_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface CreateSalesDeliveryDTO {
  sales_order_id: number;
  scheduled_date?: string;
  delivery_status?: 'planned' | 'delivered' | 'cancelled';
  tracking_number?: string;
  notes?: string;
}

export interface UpdateSalesDeliveryDTO {
  scheduled_date?: string;
  actual_delivery_date?: string;
  delivery_status?: 'planned' | 'delivered' | 'cancelled';
  tracking_number?: string;
  notes?: string;
}
