export interface AccountInvoice {
  id: number;
  workspace_id: number;
  account_id: number;
  order_id: number | null;

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

  // Status
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';

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

export interface CreateAccountInvoiceRequest {
  account_id: number;
  order_id?: number;
  invoice_type: 'payable' | 'receivable';
  invoice_amount: number;
  invoice_number?: string;
  vendor_invoice_number?: string;
  invoice_date: string;
  due_date?: string;
  description?: string;
  notes?: string;
  allow_payments?: boolean;
  payment_locked_reason?: string;
}

export interface UpdateAccountInvoiceRequest {
  account_id?: number;
  order_id?: number;
  invoice_type?: 'payable' | 'receivable';
  invoice_amount?: number;
  invoice_number?: string;
  vendor_invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  description?: string;
  notes?: string;
  allow_payments?: boolean;
  payment_locked_reason?: string;
}

export interface ListAccountInvoicesParams {
  skip?: number;
  limit?: number;
  account_id?: number;
  invoice_type?: 'payable' | 'receivable';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
}
