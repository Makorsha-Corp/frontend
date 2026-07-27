/** Shared hub stats DTOs returned by GET /{orders}/stats/ */
export interface OrderHubRecentSummary {
  id: number;
  order_number: string;
  status_id: number;
  status_name: string | null;
  created_at: string;
  updated_at: string | null;
  account_id?: number | null;
  invoice_id?: number | null;
  total_amount?: string | number | null;
  expense_category?: string | null;
  expense_date?: string | null;
  due_date?: string | null;
  source_location_type?: string | null;
  destination_location_type?: string | null;
}

export interface OrderHubPendingHighlight {
  id: number;
  order_number: string;
  status_name: string | null;
  created_at: string | null;
}
