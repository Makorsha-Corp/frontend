import type { AccountInvoice } from '@/types/accountInvoice';
import type { PurchaseOrderItem } from '@/types/purchaseOrder';

export type InvoiceVoidStatus = AccountInvoice['invoice_status'] | null;

export function canVoidPoInvoice(
  invoiceStatus: InvoiceVoidStatus,
  items: PurchaseOrderItem[] = []
): { ok: boolean; reason?: string } {
  if (invoiceStatus === 'locked') {
    return { ok: false, reason: 'Receiving has started — invoice is locked and cannot be voided' };
  }
  if (invoiceStatus !== 'confirmed') {
    return { ok: false, reason: 'Only confirmed invoices can be voided' };
  }
  if (items.some((i) => Number(i.quantity_received) > 0)) {
    return { ok: false, reason: 'Cannot void invoice after receiving has been recorded' };
  }
  return { ok: true };
}
