export interface OrderTemplateItem {
  id: number;
  workspace_id: number;
  order_template_id: number;
  line_number: number;
  description: string | null;

  quantity: number;
  unit: string | null;
  unit_price: number | null;
  line_subtotal: number | null;
  notes: string | null;
}

export interface OrderTemplate {
  id: number;
  workspace_id: number;
  template_name: string;
  description: string | null;
  account_id: number | null;
  expense_category: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_interval: number | null;
  recurrence_day: number | null;
  start_date: string | null;
  end_date: string | null;
  next_generation_date: string | null;
  last_generated_date: string | null;
  is_active: boolean;
  generate_days_before: number;
  auto_approve: boolean;
  requires_approval: boolean;
  default_approver_id: number | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface CreateOrderTemplateItem {
  description?: string | null;

  quantity?: number;
  unit?: string | null;
  unit_price?: number | null;
  notes?: string | null;
}

export interface CreateOrderTemplate {
  template_name: string;
  description?: string | null;
  account_id?: number | null;
  expense_category?: string | null;
  is_recurring?: boolean;
  recurrence_type?: string | null;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  generate_days_before?: number;
  auto_approve?: boolean;
  requires_approval?: boolean;
  default_approver_id?: number | null;
  notes?: string | null;
  items?: CreateOrderTemplateItem[];
}

export interface UpdateOrderTemplate {
  template_name?: string | null;
  description?: string | null;
  account_id?: number | null;
  expense_category?: string | null;
  is_recurring?: boolean | null;
  recurrence_type?: string | null;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  next_generation_date?: string | null;
  is_active?: boolean | null;
  auto_approve?: boolean | null;
  requires_approval?: boolean | null;
  default_approver_id?: number | null;
  notes?: string | null;
}

export interface UpdateOrderTemplateItem {
  description?: string | null;

  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  notes?: string | null;
}

export interface ListOrderTemplatesParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  expense_category?: string;
}
