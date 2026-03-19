export interface InvoicePayment {
  id: number;
  workspace_id: number;
  invoice_id: number;

  // Payment Details
  payment_amount: number;
  payment_date: string;
  payment_method: string | null;
  payment_reference: string | null;

  // Bank Details
  bank_name: string | null;
  transaction_id: string | null;

  // Notes
  notes: string | null;

  // Audit
  created_at: string;
  created_by: number | null;
}

export interface CreateInvoicePaymentRequest {
  invoice_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method?: string;
  payment_reference?: string;
  bank_name?: string;
  transaction_id?: string;
  notes?: string;
}

export interface UpdateInvoicePaymentRequest {
  payment_amount?: number;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  bank_name?: string;
  transaction_id?: string;
  notes?: string;
}

export interface ListInvoicePaymentsParams {
  invoice_id: number;
  skip?: number;
  limit?: number;
}
