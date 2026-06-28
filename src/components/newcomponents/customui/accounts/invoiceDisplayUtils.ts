import type { AccountInvoice } from '@/types/accountInvoice';

export function formatInvLabel(invoice: Pick<AccountInvoice, 'id' | 'invoice_number'>): string {
  return `Inv #${invoice.invoice_number ?? invoice.id}`;
}

export function formatOrderLabel(orderNumber: string): string {
  return `Order #${orderNumber}`;
}

export function buildInvoiceOrderNumberMap(
  purchaseOrders: { id: number; invoice_id: number | null; po_number: string }[],
  expenseOrders: { id: number; invoice_id: number | null; expense_number: string }[],
  invoices?: { id: number; order_id: number | null; order_type: string | null }[]
): Map<number, string> {
  const map = new Map<number, string>();

  if (invoices && invoices.length > 0) {
    const poById = new Map(purchaseOrders.map((po) => [po.id, po.po_number]));
    const eoById = new Map(expenseOrders.map((eo) => [eo.id, eo.expense_number]));
    for (const inv of invoices) {
      if (inv.order_id == null) continue;
      if (inv.order_type === 'purchase_order') {
        const num = poById.get(inv.order_id);
        if (num) map.set(inv.id, num);
      } else if (inv.order_type === 'expense_order') {
        const num = eoById.get(inv.order_id);
        if (num) map.set(inv.id, num);
      }
    }
  }

  // Fallback: reverse lookup for invoices not yet covered (old records without order_type)
  for (const po of purchaseOrders) {
    if (po.invoice_id != null && !map.has(po.invoice_id)) {
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
