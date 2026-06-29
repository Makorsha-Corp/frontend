export type DecimalString = string;

export interface AccountInvoiceApiResponse {
  id: number;
  workspace_id: number;
  account_id: number;
  order_id: number | null;
  order_type: string | null;
  invoice_type: 'payable' | 'receivable';
  invoice_status: 'draft' | 'confirmed' | 'voided';
  invoice_amount: DecimalString;
  paid_amount: DecimalString;
  outstanding_amount: DecimalString;
  invoice_number: string | null;
  vendor_invoice_number: string | null;
  invoice_date: string;
  due_date: string | null;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  allow_payments: boolean;
  payment_locked_reason: string | null;
  receiving_started: boolean;
  last_synced_at: string | null;
  description: string | null;
  notes: string | null;
  void_note: string | null;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
}

export interface AccountInvoice {
  id: number;
  workspace_id: number;
  account_id: number;
  order_id: number | null;
  order_type: string | null;

  // Invoice Type
  invoice_type: 'payable' | 'receivable';

  // Amounts
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number; // Computed field

  // Reference Numbers
  invoice_number: string | null;
  vendor_invoice_number: string | null;

  // Dates
  invoice_date: string;
  due_date: string | null;

  // Lifecycle
  invoice_status: 'draft' | 'confirmed' | 'voided';
  receiving_started: boolean;
  last_synced_at: string | null;

  // Status (meaningful when invoice is confirmed)
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';

  // Void note (set permanently when invoice is voided)
  void_note: string | null;

  // Admin Controls
  allow_payments: boolean;
  payment_locked_reason: string | null;

  // Description
  description: string | null;
  notes: string | null;

  // Audit
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
}

export interface InvoiceItem {
  id: number;
  workspace_id: number;
  invoice_id: number;
  line_number: number;
  description: string;
  item_id: number | null;
  source_order_item_id: number | null;
  source_order_item_type: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  line_subtotal: number;
  last_synced_at: string | null;
  created_at: string;
  created_by: number | null;
}

export interface InvoiceEvent {
  id: number;
  workspace_id: number;
  invoice_id: number;
  event_type: string;
  description: string;
  metadata_json: Record<string, unknown> | null;
  performed_by: number | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface CreateAccountInvoiceRequest {
  account_id: number;
  order_id?: number;
  invoice_type: 'payable' | 'receivable';
  invoice_amount: number | string;
  invoice_number?: string;
  vendor_invoice_number?: string;
  invoice_date: string;
  due_date?: string | null;
  description?: string;
  notes?: string;
  allow_payments?: boolean;
  payment_locked_reason?: string;
}

export interface UpdateAccountInvoiceRequest {
  account_id?: number;
  order_id?: number;
  invoice_type?: 'payable' | 'receivable';
  invoice_amount?: number | string;
  invoice_number?: string;
  vendor_invoice_number?: string;
  invoice_date?: string;
  due_date?: string | null;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  description?: string;
  notes?: string;
  allow_payments?: boolean;
  payment_locked_reason?: string;
}

export interface InvoiceStatusEntry {
  id: number;
  invoice_id: number;
  from_status: string;
  to_status: string;
  changed_at: string;
  changed_by: number | null;
  changed_by_name: string | null;
}

export interface ListAccountInvoicesParams {
  skip?: number;
  limit?: number;
  account_id?: number;
  invoice_type?: 'payable' | 'receivable';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  invoice_status?: 'draft' | 'confirmed' | 'voided';
  invoice_number_search?: string;
  account_name_search?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount_min?: number;
  amount_max?: number;
}
