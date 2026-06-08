import type { AccountInvoice } from '@/types/accountInvoice';

/** Voided invoices remain visible in lists but do not affect financial rollups. */
export function isInvoiceIncludedInFinancialTotals(invoice: AccountInvoice): boolean {
  return invoice.invoice_status !== 'voided';
}

export function aggregateAccountInvoiceTotals(invoices: AccountInvoice[]) {
  return invoices.reduce(
    (acc, inv) => {
      if (!isInvoiceIncludedInFinancialTotals(inv)) return acc;
      return {
        invoiced: acc.invoiced + inv.invoice_amount,
        paid: acc.paid + inv.paid_amount,
        outstanding: acc.outstanding + inv.outstanding_amount,
      };
    },
    { invoiced: 0, paid: 0, outstanding: 0 }
  );
}

/** Open balance filters — exclude voided even if payment_status is still unpaid. */
export function isOpenInvoiceBalance(invoice: AccountInvoice): boolean {
  if (invoice.invoice_status === 'voided') return false;
  return (
    invoice.payment_status === 'unpaid' ||
    invoice.payment_status === 'partial' ||
    invoice.payment_status === 'overdue'
  );
}
