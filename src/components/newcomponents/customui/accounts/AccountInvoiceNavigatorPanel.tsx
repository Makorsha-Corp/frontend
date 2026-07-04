import React from 'react';
import type { AccountInvoice } from '@/types/accountInvoice';
import InvoicePaymentStatusBadge from '@/components/newcomponents/customui/accounts/InvoicePaymentStatusBadge';
import {
  formatInvLabel,
  formatOrderLabel,
} from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';
import { formatInvoiceCurrency } from '@/components/newcomponents/customui/accounts/accountInvoiceFormatters';
import { ORDER_LIST_WIDTH } from '@/components/newcomponents/customui/orders/orderListConstants';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { cn } from '@/lib/utils';
import { FileText, Loader2 } from 'lucide-react';
import { API_LIMITS } from '@/constants/apiLimits';

export interface AccountInvoiceNavigatorPanelProps {
  invoices: AccountInvoice[];
  selectedInvoiceId: number | null;
  invoiceOrderNumberMap: Map<number, string | null | undefined>;
  isLoading: boolean;
  invoiceCountLabel: string;
  listCapped?: boolean;
  onSelectInvoice: (id: number) => void;
  className?: string;
}

const AccountInvoiceNavigatorPanel: React.FC<AccountInvoiceNavigatorPanelProps> = ({
  invoices,
  selectedInvoiceId,
  invoiceOrderNumberMap,
  isLoading,
  invoiceCountLabel,
  listCapped,
  onSelectInvoice,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-border bg-card w-full min-w-0 lg:w-[360px]',
        className
      )}
      style={{ maxWidth: ORDER_LIST_WIDTH }}
    >
      <div
        className={cn(
          listCapped
            ? 'shrink-0 flex flex-col justify-center gap-1 border-b border-border px-4 py-2.5'
            : cn(ORDER_PANEL_HEADER_CLASS, 'px-4')
        )}
      >
        <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-card-foreground truncate">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          Invoices
          <span className="font-normal text-muted-foreground">({invoiceCountLabel})</span>
        </h2>
        {listCapped ? (
          <p className="text-[11px] text-muted-foreground leading-snug">
            Showing first {API_LIMITS.FLEXIBLE_1000} of {invoiceCountLabel} — narrow filters to
            see more.
          </p>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">No matching invoices.</p>
        ) : (
          invoices.map((inv) => {
            const isSelected = selectedInvoiceId === inv.id;
            const linkedOrderNumber = invoiceOrderNumberMap.get(inv.id) ?? null;
            return (
              <button
                key={inv.id}
                type="button"
                data-testid={`account-invoice-nav-item-${inv.id}`}
                onClick={() => onSelectInvoice(inv.id)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left transition-colors',
                  isSelected
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-border bg-background hover:bg-muted/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {formatInvLabel(inv)}
                    </p>
                    {linkedOrderNumber ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {formatOrderLabel(linkedOrderNumber)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {inv.invoice_status === 'voided' ? (
                      <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] capitalize text-red-700 dark:text-red-300">
                        Void
                      </span>
                    ) : (
                      <InvoicePaymentStatusBadge status={inv.payment_status} className="text-[11px]" />
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{inv.invoice_type}</span>
                  <span>{formatInvoiceCurrency(inv.outstanding_amount)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountInvoiceNavigatorPanel;
