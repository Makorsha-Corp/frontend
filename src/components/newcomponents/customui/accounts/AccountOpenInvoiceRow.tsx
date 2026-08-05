import React from 'react';
import { Loader2 } from 'lucide-react';
import type { AccountInvoice } from '@/types/accountInvoice';
import { useGetInvoiceItemsQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import { formatInvLabel } from './invoiceDisplayUtils';
import { formatInvoiceItemsPreview } from './formatInvoiceItemsPreview';

export interface AccountOpenInvoiceRowProps {
  invoice: AccountInvoice;
  orderNumber?: string | null;
  fetchEnabled?: boolean;
  highlightItemId?: number | null;
  highlightItemName?: string | null;
}

/** Shared column template for open-invoice list header + rows */
export const OPEN_INVOICE_ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_4.75rem] gap-x-3 sm:grid-cols-[minmax(7.5rem,1fr)_minmax(0,1.5fr)_5.5rem] sm:gap-x-4';

const AccountOpenInvoiceRow: React.FC<AccountOpenInvoiceRowProps> = ({
  invoice,
  orderNumber,
  fetchEnabled = true,
  highlightItemId,
  highlightItemName,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetInvoiceItemsQuery(invoice.id, {
    skip: !fetchEnabled,
  });

  const itemsPreview = formatInvoiceItemsPreview(items, {
    maxLines: 2,
    prioritizeItemId: highlightItemId,
    prioritizeItemName: highlightItemName,
  });
  const detailLine =
    itemsLoading ? null : itemsPreview ?? invoice.description?.trim() ?? 'No line items synced';

  const titleParts = [formatInvLabel(invoice)];
  if (orderNumber) titleParts.push(orderNumber);

  const showOutstanding =
    invoice.outstanding_amount > 0 &&
    invoice.payment_status !== 'paid' &&
    invoice.outstanding_amount !== invoice.invoice_amount;

  return (
    <li
      className={`${OPEN_INVOICE_ROW_GRID} items-start px-3 py-2.5 text-sm`}
      data-testid={`account-dialog-open-invoice-${invoice.id}`}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium text-card-foreground">{titleParts.join(' · ')}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {invoice.invoice_type} · {invoice.payment_status} · {formatInvoiceDate(invoice.invoice_date)}
        </p>
      </div>

      <div className="min-w-0 self-center">
        {itemsLoading ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            <span className="truncate">Loading items…</span>
          </p>
        ) : (
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{detailLine}</p>
        )}
      </div>

      <div className="shrink-0 self-start text-right">
        <p className="font-medium tabular-nums text-card-foreground">
          {formatInvoiceCurrency(invoice.invoice_amount)}
        </p>
        {showOutstanding ? (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {formatInvoiceCurrency(invoice.outstanding_amount)} outstanding
          </p>
        ) : invoice.payment_status !== 'paid' ? (
          <p className="text-[11px] text-muted-foreground">outstanding</p>
        ) : null}
      </div>
    </li>
  );
};

export default AccountOpenInvoiceRow;
