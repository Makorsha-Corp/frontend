export interface SalesOrder {
  id: number;
  workspace_id: number;
  sales_order_number: string;
  account_id: number;
  factory_id: number;
  order_date: string;
  quotation_sent_date: string | null;
  expected_delivery_date: string | null;
  total_amount: number;
  current_status_id: number;
  is_fully_delivered: boolean;
  invoice_id: number | null;
  is_invoiced: boolean;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface CreateSalesOrderDTO {
  account_id: number;
  factory_id: number;
  order_date: string;
  quotation_sent_date?: string;
  expected_delivery_date?: string;
  current_status_id?: number;
  notes?: string;
  // Note: total_amount is calculated automatically from items
}

export interface UpdateSalesOrderDTO {
  quotation_sent_date?: string;
  expected_delivery_date?: string;
  total_amount?: number;
  current_status_id?: number;
  is_fully_delivered?: boolean;
  invoice_id?: number;
  is_invoiced?: boolean;
  notes?: string;
}
