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

export interface ExpenseOrderFinancialBucket {
  key: string;
  label: string;
  count: number;
  total_value: number | string;
}

export interface ExpenseOrderOpenByAccountBucket {
  account_id: number;
  account_name: string | null;
  count: number;
  total_value: number | string;
}

export interface ExpenseOrderFinancialSample {
  id: number;
  order_number: string;
  total_value?: number | string | null;
  sublabel?: string | null;
}

export interface ExpenseOrderDueTimelineBucket {
  key: string;
  label: string;
  count: number;
  total_value: number | string;
  samples: ExpenseOrderFinancialSample[];
}

export interface ExpenseOrderUnpaidPipelineBucket {
  key: string;
  label: string;
  count: number;
  outstanding_value: number | string;
  samples: ExpenseOrderFinancialSample[];
}

export interface ExpenseOrderFinancialSnapshot {
  category_breakdown: ExpenseOrderFinancialBucket[];
  stage_pipeline: ExpenseOrderFinancialBucket[];
  open_by_account: ExpenseOrderOpenByAccountBucket[];
  due_timeline: ExpenseOrderDueTimelineBucket[];
  unpaid_pipeline: ExpenseOrderUnpaidPipelineBucket[];
}
