export interface SalesOrder {
  id: number;
  workspace_id: number;
  sales_order_number: string;
  account_id: number;
  factory_id: number;
  order_date: string;
  expected_delivery_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  total_amount: number;
  current_status_id: number;
  is_fully_delivered: boolean;
  invoice_id: number | null;
  is_invoiced: boolean;
  paid: boolean;
  invoice_payment_status: string | null;

  // Approval workflow
  order_info_confirmed: boolean;
  items_confirmed: boolean;
  invoice_confirmed: boolean;
  required_approvals: number | null;

  // Completion
  order_completed: boolean;
  completed_at: string | null;

  description: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface CreateSalesOrderDTO {
  account_id: number;
  factory_id: number;
  order_date: string;
  expected_delivery_date?: string;
  contact_name?: string;
  contact_phone?: string;
  current_status_id?: number;
  description?: string;
  // Note: total_amount is calculated automatically from items
}

export interface UpdateSalesOrderDTO {
  expected_delivery_date?: string;
  contact_name?: string;
  contact_phone?: string;
  total_amount?: number;
  is_fully_delivered?: boolean;
  invoice_id?: number;
  is_invoiced?: boolean;
  description?: string;
  required_approvals?: number | null;
}

// ─── Approvers ────────────────────────────────────────────────

export interface SalesOrderApprover {
  id: number;
  workspace_id: number;
  sales_order_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
  approved: boolean;
  approved_at: string | null;
}

export interface SalesOrderApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface SalesOrderApproversList {
  approvers: SalesOrderApprover[];
  summary: SalesOrderApprovalSummary;
}

// ─── Section confirm ──────────────────────────────────────────

export type SalesOrderSection = 'order_info' | 'items';

export interface SalesOrderSectionConfirmRequest {
  section: SalesOrderSection;
  confirmed: boolean;
}

// ─── Events ───────────────────────────────────────────────────

export interface SalesOrderEventMetadata {
  user_id?: number | null;
  user_name?: string | null;
  invoice_id?: number | null;
  paid?: boolean | null;
}

export interface SalesOrderEvent {
  id: number;
  workspace_id: number;
  sales_order_id: number;
  event_type: string;
  description: string;
  metadata: SalesOrderEventMetadata | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
}
