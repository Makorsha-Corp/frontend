import React from 'react';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import InvoiceDueDateField from './InvoiceDueDateField';
import { cn } from '@/lib/utils';

export interface AccountInvoiceSummaryCardProps {
  invoice: AccountInvoice;
  /** When true, due date is display-only (e.g. finalized invoice on a PO). */
  dueDateReadOnly?: boolean;
  /** Show Payments allowed/locked value (DetailPanel: confirmed only). Fourth column always rendered. */
  showPaymentsField?: boolean;
  /** Line-through on invoice amount when voided. */
  amountsVoided?: boolean;
  /** card = white/card shell; inset = surface-inset (lighter block on dark canvas) */
  surface?: 'card' | 'inset';
  className?: string;
}

const VALUE_CLASS =
  'text-base font-semibold tabular-nums leading-tight text-card-foreground';

/** Shared shell for invoice detail blocks (summary, items, notes, draft banner) */
export const INVOICE_DETAIL_SECTION_SHELL =
  'rounded-md border border-border bg-card shadow-sm';

function SummaryCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

const AccountInvoiceSummaryCard: React.FC<AccountInvoiceSummaryCardProps> = ({
  invoice,
  dueDateReadOnly = false,
  showPaymentsField = true,
  amountsVoided = false,
  surface = 'card',
  className,
}) => {
  const paymentsValue = showPaymentsField ? (
    <p
      className={cn(
        VALUE_CLASS,
        invoice.allow_payments
          ? 'text-green-600 dark:text-green-400'
          : 'text-amber-600 dark:text-amber-400'
      )}
    >
      {invoice.allow_payments ? 'Allowed' : 'Locked'}
    </p>
  ) : (
    <p className={cn(VALUE_CLASS, 'text-muted-foreground')}>—</p>
  );

  return (
    <div
      className={cn(
        'px-4 py-3.5',
        surface === 'inset'
          ? 'rounded-md border border-border surface-inset'
          : INVOICE_DETAIL_SECTION_SHELL,
        className
      )}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <SummaryCell label="Invoice date">
          <p className={VALUE_CLASS}>{formatInvoiceDate(invoice.invoice_date)}</p>
        </SummaryCell>
        <SummaryCell label="Due date">
          <InvoiceDueDateField invoice={invoice} readOnly={dueDateReadOnly} compact />
        </SummaryCell>
        <SummaryCell label="Type">
          <p className={cn(VALUE_CLASS, 'capitalize')}>{invoice.invoice_type}</p>
        </SummaryCell>
        <SummaryCell label="Payments">{paymentsValue}</SummaryCell>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <div className="grid grid-cols-3 gap-x-6">
          <SummaryCell label="Invoice amount">
            <p
              className={cn(
                VALUE_CLASS,
                amountsVoided && 'text-muted-foreground line-through'
              )}
            >
              {formatInvoiceCurrency(invoice.invoice_amount)}
            </p>
          </SummaryCell>
          <SummaryCell label="Paid">
            <p className={VALUE_CLASS}>{formatInvoiceCurrency(invoice.paid_amount)}</p>
          </SummaryCell>
          <SummaryCell label="Outstanding">
            <p className={VALUE_CLASS}>{formatInvoiceCurrency(invoice.outstanding_amount)}</p>
          </SummaryCell>
        </div>
      </div>

      {invoice.notes ? (
        <div className="mt-4 border-t border-border/60 pt-4 text-sm text-card-foreground">
          <p className="text-xs font-medium text-muted-foreground">Notes</p>
          <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      ) : null}
    </div>
  );
};

export default AccountInvoiceSummaryCard;
