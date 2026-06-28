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
  cost_center_type: string | null;
  cost_center_id: number | null;
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
  current_status_name?: string | null;
  order_workflow_id: number | null;
  invoice_id: number | null;
  required_approvals: number | null;
  details_confirmed: boolean;
  items_confirmed: boolean;
  invoice_confirmed: boolean;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
  items_updated_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  completed_by: number | null;
  completed_at: string | null;
  order_completed?: boolean;
}

export interface CreateExpenseOrderItem {
  description?: string | null;
  quantity?: number;
  unit?: string | null;
  unit_price?: number | null;
  cost_center_type?: string | null;
  cost_center_id?: number | null;
  notes?: string | null;
}

export interface CreateExpenseOrder {
  account_id?: number | null;
  expense_category: string;
  expense_date?: string | null;
  due_date?: string | null;
  description?: string | null;
  current_status_id?: number;
  order_workflow_id?: number | null;
  items?: CreateExpenseOrderItem[];
}

export interface UpdateExpenseOrder {
  account_id?: number | null;
  expense_category?: string | null;
  expense_date?: string | null;
  due_date?: string | null;
  current_status_id?: number | null;
  invoice_id?: number | null;
  required_approvals?: number | null;
  description?: string | null;
  details_confirmed?: boolean | null;
  items_confirmed?: boolean | null;
  invoice_confirmed?: boolean | null;
}

export interface UpdateExpenseOrderItem {
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  cost_center_type?: string | null;
  cost_center_id?: number | null;
  approved?: boolean | null;
  notes?: string | null;
}

export interface ListExpenseOrdersParams {
  skip?: number;
  limit?: number;
  expense_category?: string;
  account_id?: number;
  invoice_id?: number;
}

export type ExpenseOrderSection = 'details' | 'items' | 'invoice';

export interface ExpenseOrderSectionConfirmRequest {
  section: ExpenseOrderSection;
  confirmed: boolean;
}

export interface ExpenseOrderApprover {
  id: number;
  workspace_id: number;
  expense_order_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
  approved: boolean;
  approved_at: string | null;
}

export interface ExpenseApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface ExpenseOrderApproversList {
  approvers: ExpenseOrderApprover[];
  summary: ExpenseApprovalSummary;
}

export interface ExpenseOrderEvent {
  id: number;
  workspace_id: number;
  expense_order_id: number;
  event_type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  performed_by: number | null;
  performer_name: string | null;
  created_at: string;
}
