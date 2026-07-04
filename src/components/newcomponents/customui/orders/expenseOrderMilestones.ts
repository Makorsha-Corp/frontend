import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseApprovalSummary } from '@/types/expenseOrder';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { Status } from '@/types/status';

export type EoScrollSection = 'details' | 'items' | 'approvals' | 'invoice';

export type EoChecklistPhase = 'approval' | 'invoice_blocked' | 'mark_complete' | 'payment' | 'done';

export const EO_STAGE_NAMES = ['Draft', 'Invoiced', 'Complete'] as const;
export type EoStageName = (typeof EO_STAGE_NAMES)[number] | 'Approved';

/** EO orders considered in-flight on the overview hub deep link. */
export const EO_SCOPE_OPEN_STATUS_NAMES = ['Draft', 'Invoiced'] as const;

/** Synthetic stage rows for the list filter — no DB-backed status for expense orders anymore. */
export const EO_STAGE_FILTER_OPTIONS: Status[] = [
  { id: 1, name: 'Draft', comment: '' },
  { id: 2, name: 'Invoiced', comment: '' },
  { id: 3, name: 'Complete', comment: '' },
];

export function isExpenseOrderCompleted(order: ExpenseOrder): boolean {
  return Boolean(order.completed_at) || Boolean(order.order_completed);
}

export function isEoApprovalsComplete(approvalSummary: ExpenseApprovalSummary): boolean {
  if (approvalSummary.required === 0) return true;
  return approvalSummary.met && approvalSummary.approved_count > 0;
}

/** Detail-panel-level stage: approval data is available here. */
export function deriveExpenseOrderStage(
  order: ExpenseOrder,
  approvalSummary: ExpenseApprovalSummary
): EoStageName {
  if (isExpenseOrderCompleted(order)) return 'Complete';
  if (order.invoice_id != null) return 'Invoiced';
  if (isEoApprovalsComplete(approvalSummary)) return 'Approved';
  return 'Draft';
}

/**
 * List-level stage: no approval data available on the list payload. 'Approved' isn't
 * reachable here — since the invoice now auto-creates once approvals are met, invoice_id
 * being set is already a good proxy for "approved", so this is a deliberate 3-state
 * simplification of the 4-state detail-panel stage.
 */
export function deriveExpenseOrderStageFromOrder(order: ExpenseOrder): EoStageName {
  if (isExpenseOrderCompleted(order)) return 'Complete';
  if (order.invoice_id != null) return 'Invoiced';
  return 'Draft';
}

export function eoStageBadgeClassName(stageName: EoStageName | string | null | undefined): string {
  switch (stageName) {
    case 'Draft':
      return 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    case 'Approved':
      return 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    case 'Invoiced':
      return 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
    case 'Complete':
      return 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    default:
      return 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50';
  }
}

export interface EoChecklistProgress {
  stage: EoStageName;
  phase: EoChecklistPhase;
  hasDetails: boolean;
  hasItems: boolean;
  approvalsComplete: boolean;
  approvalRatio: string;
  hasInvoice: boolean;
  invoiceFinalized: boolean;
  orderCompleted: boolean;
  invoicePaymentStatus: string | null | undefined;
}

export function getEoChecklistPhase(
  approvalsComplete: boolean,
  hasInvoice: boolean,
  orderCompleted: boolean,
  invoicePaymentStatus?: string | null
): EoChecklistPhase {
  if (orderCompleted) return invoicePaymentStatus === 'paid' ? 'done' : 'payment';
  if (!approvalsComplete) return 'approval';
  if (!hasInvoice) return 'invoice_blocked';
  return 'mark_complete';
}

export function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'partial':
      return 'Partial';
    case 'overdue':
      return 'Overdue';
    case 'unpaid':
      return 'Not paid';
    default:
      return 'Not paid';
  }
}

export function paymentStatusBadgeTone(
  status: string | null | undefined
): 'green' | 'amber' | 'muted' {
  if (status === 'paid') return 'green';
  if (status === 'partial' || status === 'overdue' || status === 'unpaid') return 'amber';
  return 'muted';
}

export function getEoChecklistProgress(
  order: ExpenseOrder,
  itemCount: number,
  approvalSummary: ExpenseApprovalSummary,
  linkedInvoice?: AccountInvoice | null
): EoChecklistProgress {
  const hasDetails = Boolean(order.expense_category && order.expense_date);
  const hasItems = itemCount > 0;
  const approvalsComplete = isEoApprovalsComplete(approvalSummary);
  const hasInvoice = order.invoice_id != null;
  const invoiceFinalized = linkedInvoice?.invoice_status === 'confirmed';
  const orderCompleted = isExpenseOrderCompleted(order);
  const invoicePaymentStatus = linkedInvoice?.payment_status;
  const stage = deriveExpenseOrderStage(order, approvalSummary);
  const phase = getEoChecklistPhase(approvalsComplete, hasInvoice, orderCompleted, invoicePaymentStatus);

  return {
    stage,
    phase,
    hasDetails,
    hasItems,
    approvalsComplete,
    approvalRatio: `${approvalSummary.approved_count}/${approvalSummary.required}`,
    hasInvoice,
    invoiceFinalized,
    orderCompleted,
    invoicePaymentStatus,
  };
}
