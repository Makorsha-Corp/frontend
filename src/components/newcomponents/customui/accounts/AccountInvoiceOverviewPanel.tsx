import React from 'react';
import { Loader2 } from 'lucide-react';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import { useGetAccountInvoiceByIdQuery, useGetInvoiceEventsQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { useLinkedOrderForInvoice } from './useLinkedOrderForInvoice';
import AccountInvoiceSummaryCard from './AccountInvoiceSummaryCard';
import AccountInvoicePaymentsSection from './AccountInvoicePaymentsSection';
import InvoiceEventLogCard from './InvoiceEventLogCard';
import InvoicePaymentStatusBadge from './InvoicePaymentStatusBadge';

export interface AccountInvoiceOverviewPanelProps {
  invoiceId: number;
  invoice?: AccountInvoice;
  accountName?: string | null;
  linkedOrderNumber?: string | null;
  showOrderSummary?: boolean;
  /** When true, due date is read-only (finalized invoice embedded on PO). */
  dueDateReadOnly?: boolean;
}

const AccountInvoiceOverviewPanel: React.FC<AccountInvoiceOverviewPanelProps> = ({
  invoiceId,
  invoice: invoiceProp,
  accountName: accountNameProp,
  linkedOrderNumber: linkedOrderNumberProp,
  showOrderSummary = false,
  dueDateReadOnly = false,
}) => {
  const { data: fetchedInvoice, isLoading, isError } = useGetAccountInvoiceByIdQuery(invoiceId);
  const invoice = fetchedInvoice ?? invoiceProp;
  const { data: events = [] } = useGetInvoiceEventsQuery(invoiceId);

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
          {invoice.invoice_status !== 'voided' && (
            <InvoicePaymentStatusBadge status={invoice.payment_status} />
          )}
        </div>
      </div>

      <AccountInvoiceSummaryCard
        invoice={invoice}
        dueDateReadOnly={dueDateReadOnly}
        showPaymentsField
      />

      <AccountInvoicePaymentsSection invoice={invoice} />

      <InvoiceEventLogCard events={events} invoice={invoice} />

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
