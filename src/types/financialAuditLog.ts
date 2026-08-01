/**
 * Financial Audit Log Types
 *
 * Unified audit trail for all financial operations (accounts, invoices, payments)
 */

export interface FinancialAuditLog {
  id: number;
  workspace_id: number;

  // What entity was affected
  entity_type: 'account' | 'invoice' | 'payment';
  entity_id: number;

  // What action was performed
  action_type: 'created' | 'updated' | 'deleted' | 'status_changed';

  // Related entity (e.g., payment -> invoice -> account)
  related_entity_type?: 'account' | 'invoice' | 'payment' | null;
  related_entity_id?: number | null;

  // Changes made (JSON with before/after states)
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    invoice_status_changed?: {
      before: string;
      after: string;
    };
    [key: string]: any;
  } | null;

  // Human-readable description
  description?: string | null;

  // Who performed the action
  performed_by: number;
  performed_at: string; // ISO datetime

  // Optional metadata
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AuditLogFilters {
  entity_type?: 'account' | 'invoice' | 'payment';
  entity_id?: number;
  action_type?: 'created' | 'updated' | 'deleted' | 'status_changed';
  user_id?: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}
