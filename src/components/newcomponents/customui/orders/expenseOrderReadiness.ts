import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseOrderItem } from '@/types/expenseOrder';
import type { AccountInvoice } from '@/types/accountInvoice';

export interface EoReadiness {
  ok: boolean;
  reason?: string;
}

export function isEoDetailsReady(order: ExpenseOrder): EoReadiness {
  if (!order.expense_category?.trim()) {
    return { ok: false, reason: 'Set an expense category' };
  }
  if (order.expense_category !== 'other' && order.cost_center_id == null) {
    return { ok: false, reason: `Select a ${order.expense_category} for this expense order` };
  }
  if (!order.description?.trim()) {
    return { ok: false, reason: 'Add a description' };
  }
  if (!order.expense_date) {
    return { ok: false, reason: 'Set an expense date' };
  }
  return { ok: true };
}

export function isEoItemsReady(items: ExpenseOrderItem[]): EoReadiness {
  if (items.length === 0) {
    return { ok: false, reason: 'Add at least one expense line' };
  }
  const invalid = items.find(
    (i) => !(i.description ?? '').trim() || Number(i.quantity) <= 0
  );
  if (invalid) {
    return { ok: false, reason: 'Each expense line needs a description and positive quantity' };
  }
  return { ok: true };
}

export function isEoInvoiceFinalized(linkedInvoice?: AccountInvoice | null): EoReadiness {
  if (!linkedInvoice) {
    return { ok: false, reason: 'Invoice has not been created yet' };
  }
  if (linkedInvoice.invoice_status !== 'confirmed') {
    return { ok: false, reason: 'Invoice is still in draft — completing the order will finalize it' };
  }
  return { ok: true };
}
