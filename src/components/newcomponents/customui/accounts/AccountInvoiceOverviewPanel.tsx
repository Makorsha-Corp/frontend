import React from 'react';
import { Loader2 } from 'lucide-react';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { useLinkedOrderForInvoice } from './useLinkedOrderForInvoice';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import AccountInvoicePaymentsSection from './AccountInvoicePaymentsSection';

export interface AccountInvoiceOverviewPanelProps {
  invoiceId: number;
  invoice?: AccountInvoice;
  accountName?: string | null;
  linkedOrderNumber?: string | null;
  showOrderSummary?: boolean;
}

const AccountInvoiceOverviewPanel: React.FC<AccountInvoiceOverviewPanelProps> = ({
  invoiceId,
  invoice: invoiceProp,
  accountName: accountNameProp,
  linkedOrderNumber: linkedOrderNumberProp,
  showOrderSummary = false,
}) => {
  const { data: fetchedInvoice, isLoading, isError } = useGetAccountInvoiceByIdQuery(invoiceId);
  const invoice = fetchedInvoice ?? invoiceProp;

  const { data: account } = useGetAccountByIdQuery(invoice?.account_id ?? 0, {
    skip: !invoice?.account_id || accountNameProp !== undefined,
  });
  const accountName =
    accountNameProp ?? account?.name ?? (invoice ? `Account #${invoice.account_id}` : null);
  const vendorLabel = invoice?.invoice_type === 'receivable' ? 'Client' : 'Vendor';

  const { orderNumber: fetchedOrderNumber, isLoading: isOrderLoading } = useLinkedOrderForInvoice(
    invoiceId,
    { skip: linkedOrderNumberProp !== undefined }
  );
  const linkedOrderNumber =
    linkedOrderNumberProp !== undefined ? linkedOrderNumberProp : fetchedOrderNumber;

  if (isLoading && !invoice) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading invoice...
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <p className="text-sm text-destructive py-4">Could not load invoice #{invoiceId}.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          {accountName ? (
            <p className="text-sm font-semibold text-card-foreground">{accountName}</p>
          ) : null}
          {invoice.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {invoice.description}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {vendorLabel} invoice
              {invoice.vendor_invoice_number ? ` · #${invoice.vendor_invoice_number}` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {showOrderSummary ? (
            <OrderDetailsSummary
              invoice={invoice}
              linkedOrderNumber={
                linkedOrderNumberProp !== undefined
                  ? linkedOrderNumberProp
                  : isOrderLoading
                    ? undefined
                    : linkedOrderNumber
              }
            />
          ) : null}
          <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
            {invoice.payment_status}
          </span>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Invoice amount</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
              {formatInvoiceCurrency(invoice.invoice_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Paid</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
              {formatInvoiceCurrency(invoice.paid_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
              {formatInvoiceCurrency(invoice.outstanding_amount)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
          <p className="mt-0.5 text-sm text-card-foreground">{formatInvoiceDate(invoice.invoice_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Due Date</p>
          <p className="mt-0.5 text-sm text-card-foreground">{formatInvoiceDate(invoice.due_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <p className="mt-0.5 text-sm capitalize text-card-foreground">{invoice.invoice_type}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Payments</p>
          <p
            className={`mt-0.5 text-sm font-medium ${
              invoice.allow_payments
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {invoice.allow_payments ? 'Allowed' : 'Locked'}
          </p>
        </div>
      </div>

      <AccountInvoicePaymentsSection invoice={invoice} />

      {invoice.notes ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="font-medium mr-2">Notes:</span>
          {invoice.notes}
        </div>
      ) : null}
    </div>
  );
};

export default AccountInvoiceOverviewPanel;
