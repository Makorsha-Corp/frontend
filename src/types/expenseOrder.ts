export interface ExpenseOrderItem {
  id: number;
  workspace_id: number;
  expense_order_id: number;
  line_number: number;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  line_subtotal: number | null;
  approved: boolean;
  notes: string | null;
}

export interface ExpenseOrder {
  id: number;
  workspace_id: number;
  expense_number: string;
  order_template_id: number | null;
  account_id: number | null;
  expense_category: string;
  expense_date: string;
  due_date: string | null;
  subtotal: number;
  total_amount: number;
  current_status_id: number;
  order_workflow_id: number | null;
  invoice_id: number | null;
  description: string | null;
  expense_note: string | null;
  internal_note: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
}

export interface CreateExpenseOrderItem {
  description?: string | null;
  quantity?: number;
  unit?: string | null;
  unit_price?: number | null;
  notes?: string | null;
}

export interface CreateExpenseOrder {
  account_id?: number | null;
  expense_category: string;
  expense_date?: string | null;
  due_date?: string | null;
  description?: string | null;
  expense_note?: string | null;
  internal_note?: string | null;
  current_status_id?: number;
  order_workflow_id?: number | null;
  items?: CreateExpenseOrderItem[];
}

export interface UpdateExpenseOrder {
  account_id?: number | null;
  expense_category?: string | null;
  due_date?: string | null;
  current_status_id?: number | null;
  invoice_id?: number | null;
  description?: string | null;
  expense_note?: string | null;
  internal_note?: string | null;
}

export interface UpdateExpenseOrderItem {
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  approved?: boolean | null;
  notes?: string | null;
}

export interface ListExpenseOrdersParams {
  skip?: number;
  limit?: number;
  expense_category?: string;
  account_id?: number;
}
