import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseApprovalSummary } from '@/types/expenseOrder';
import type { Status } from '@/types/status';

export type EoScrollSection = 'details' | 'items' | 'approvals' | 'invoice';

export type EoChecklistPhase = 'prepare' | 'approval' | 'invoice' | 'mark_complete' | 'done';

export const EO_STAGE_NAMES = ['Draft', 'Approved', 'Invoiced', 'Complete'] as const;
export type EoStageName = (typeof EO_STAGE_NAMES)[number];

export function statusesForEoWorkflowFilter(statuses: Status[]): Status[] {
  const byName = new Map(statuses.map((s) => [s.name, s]));
  return EO_STAGE_NAMES.flatMap((name) => {
    const row = byName.get(name);
    return row ? [row] : [];
  });
}

export interface EoSectionConfirmState {
  details_confirmed: boolean;
  items_confirmed: boolean;
  invoice_confirmed: boolean;
}

export function sectionConfirmsFromOrder(order: ExpenseOrder): EoSectionConfirmState {
  return {
    details_confirmed: order.details_confirmed,
    items_confirmed: order.items_confirmed,
    invoice_confirmed: order.invoice_confirmed,
  };
}

export function isExpenseOrderCompleted(order: ExpenseOrder): boolean {
  return Boolean(order.completed_at) || Boolean(order.order_completed);
}

export function isEoPrepareComplete(
  order: ExpenseOrder,
  sectionConfirms?: EoSectionConfirmState
): boolean {
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  return confirms.details_confirmed && confirms.items_confirmed;
}

export function isEoApprovalsComplete(approvalSummary: ExpenseApprovalSummary): boolean {
  if (approvalSummary.required === 0) return true;
  return approvalSummary.met && approvalSummary.approved_count > 0;
}

export function isEoInvoiceComplete(order: ExpenseOrder, sectionConfirms?: EoSectionConfirmState): boolean {
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  return Boolean(order.invoice_id) && confirms.invoice_confirmed;
}

export function deriveExpenseOrderStage(
  order: ExpenseOrder,
  approvalSummary: ExpenseApprovalSummary,
  sectionConfirms?: EoSectionConfirmState
): EoStageName {
  if (isExpenseOrderCompleted(order)) return 'Complete';
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  if (confirms.invoice_confirmed && order.invoice_id) return 'Invoiced';
  if (isEoPrepareComplete(order, confirms) && isEoApprovalsComplete(approvalSummary)) return 'Approved';
  return 'Draft';
}

export function deriveExpenseOrderStageFromOrder(order: ExpenseOrder): EoStageName {
  if (isExpenseOrderCompleted(order)) return 'Complete';
  if (order.invoice_confirmed && order.invoice_id) return 'Invoiced';
  if (order.details_confirmed && order.items_confirmed) return 'Approved';
  return 'Draft';
}

export function getEoChecklistPhase(
  prepareComplete: boolean,
  approvalsComplete: boolean,
  invoiceComplete: boolean,
  orderCompleted: boolean
): EoChecklistPhase {
  if (orderCompleted) return 'done';
  if (!prepareComplete) return 'prepare';
  if (!approvalsComplete) return 'approval';
  if (!invoiceComplete) return 'invoice';
  return 'mark_complete';
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
  detailsConfirmed: boolean;
  itemsConfirmed: boolean;
  prepareComplete: boolean;
  prepareRatio: string;
  approvalsComplete: boolean;
  approvalRatio: string;
  invoiceComplete: boolean;
  hasInvoice: boolean;
  invoiceConfirmed: boolean;
  orderCompleted: boolean;
}

export function getEoChecklistProgress(
  order: ExpenseOrder,
  itemCount: number,
  approvalSummary: ExpenseApprovalSummary,
  sectionConfirms?: EoSectionConfirmState
): EoChecklistProgress {
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  const hasDetails = Boolean(order.expense_category && order.expense_date);
  const hasItems = itemCount > 0;
  const detailsConfirmed = confirms.details_confirmed;
  const itemsConfirmed = confirms.items_confirmed;
  const prepareComplete = detailsConfirmed && itemsConfirmed;
  const prepareDoneCount = (detailsConfirmed ? 1 : 0) + (itemsConfirmed ? 1 : 0);
  const approvalsComplete = isEoApprovalsComplete(approvalSummary);
  const hasInvoice = order.invoice_id != null;
  const invoiceConfirmed = confirms.invoice_confirmed;
  const invoiceComplete = isEoInvoiceComplete(order, confirms);
  const orderCompleted = isExpenseOrderCompleted(order);
  const stage = deriveExpenseOrderStage(order, approvalSummary, confirms);
  const phase = getEoChecklistPhase(
    prepareComplete,
    approvalsComplete,
    invoiceComplete,
    orderCompleted
  );

  return {
    stage,
    phase,
    hasDetails,
    hasItems,
    detailsConfirmed,
    itemsConfirmed,
    prepareComplete,
    prepareRatio: `${prepareDoneCount}/2`,
    approvalsComplete,
    approvalRatio: `${approvalSummary.approved_count}/${approvalSummary.required}`,
    invoiceComplete,
    hasInvoice,
    invoiceConfirmed,
    orderCompleted,
  };
}
