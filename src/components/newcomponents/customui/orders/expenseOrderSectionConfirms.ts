import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseOrderItem } from '@/types/expenseOrder';
import type { AccountInvoice } from '@/types/accountInvoice';

export type EoSectionConfirmKey = 'details' | 'items' | 'invoice';

export interface EoSectionConfirmReadiness {
  ok: boolean;
  reason?: string;
}

const SECTION_LABELS: Record<EoSectionConfirmKey, string> = {
  details: 'Order details',
  items: 'Expenses',
  invoice: 'Linked invoice',
};

export function getEoSectionConfirmReadiness(
  section: EoSectionConfirmKey,
  order: ExpenseOrder,
  items: ExpenseOrderItem[],
  linkedInvoice?: AccountInvoice | null
): EoSectionConfirmReadiness {
  if (section === 'details') {
    if (!order.expense_category?.trim()) {
      return { ok: false, reason: 'Set an expense category before confirming order details' };
    }
    if (!order.expense_date) {
      return { ok: false, reason: 'Set an expense date before confirming order details' };
    }
    return { ok: true };
  }
  if (section === 'items') {
    if (items.length === 0) {
      return { ok: false, reason: 'Add at least one expense line before confirming' };
    }
    const invalid = items.find(
      (i) => !(i.description ?? '').trim() || Number(i.quantity) <= 0
    );
    if (invalid) {
      return { ok: false, reason: 'Each expense line needs a description and positive quantity' };
    }
    return { ok: true };
  }
  if (!order.invoice_id) {
    return { ok: false, reason: 'Create a draft invoice before confirming this section' };
  }
  if (!linkedInvoice || linkedInvoice.invoice_status !== 'confirmed') {
    return { ok: false, reason: 'Finalize the linked invoice before confirming this section' };
  }
  return { ok: true };
}

export function eoSectionConfirmLabel(section: EoSectionConfirmKey): string {
  return SECTION_LABELS[section];
}
