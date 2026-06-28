import type { AccountInvoice } from '@/types/accountInvoice';

export type InvoiceVoidStatus = AccountInvoice['invoice_status'] | null;

export function canVoidPoInvoice(
  invoiceStatus: InvoiceVoidStatus,
  hasActiveReceiving: boolean = false
): { ok: boolean; reason?: string } {
  if (invoiceStatus !== 'confirmed') {
    return { ok: false, reason: 'Only confirmed invoices can be voided' };
  }
  if (hasActiveReceiving) {
    return { ok: false, reason: 'Receiving quantities are recorded — zero them out before voiding' };
  }
  return { ok: true };
}
