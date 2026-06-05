import type { AccountInvoice } from '@/types/accountInvoice';

export function formatInvLabel(invoice: Pick<AccountInvoice, 'id' | 'invoice_number'>): string {
  return `Inv #${invoice.invoice_number ?? invoice.id}`;
}

export function formatOrderLabel(orderNumber: string): string {
  return `Order #${orderNumber}`;
}

export function buildInvoiceOrderNumberMap(
  purchaseOrders: { invoice_id: number | null; po_number: string }[],
  expenseOrders: { invoice_id: number | null; expense_number: string }[]
): Map<number, string> {
  const map = new Map<number, string>();
  for (const po of purchaseOrders) {
    if (po.invoice_id != null) {
      map.set(po.invoice_id, po.po_number);
    }
  }
  for (const eo of expenseOrders) {
    if (eo.invoice_id != null && !map.has(eo.invoice_id)) {
      map.set(eo.invoice_id, eo.expense_number);
    }
  }
  return map;
}
