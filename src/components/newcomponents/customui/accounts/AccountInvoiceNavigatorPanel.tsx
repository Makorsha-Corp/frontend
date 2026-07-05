import React from 'react';
import type { AccountInvoice } from '@/types/accountInvoice';
import InvoicePaymentStatusBadge from '@/components/newcomponents/customui/accounts/InvoicePaymentStatusBadge';
import InvoiceStatusBadge from '@/components/newcomponents/customui/accounts/InvoiceStatusBadge';
import { formatInvLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';
import { formatInvoiceCurrency } from '@/components/newcomponents/customui/accounts/accountInvoiceFormatters';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
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

const chipClass =
  'inline-flex items-center bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[11px]';

interface AccountInvoiceListRowProps {
  invoice: AccountInvoice;
  isSelected: boolean;
  linkedOrderNumber: string | null;
  onSelect: () => void;
}

function AccountInvoiceListRow({
  invoice,
  isSelected,
  linkedOrderNumber,
  onSelect,
}: AccountInvoiceListRowProps) {
  const isVoided = invoice.invoice_status === 'voided';
  const isConfirmed = invoice.invoice_status === 'confirmed';
  const hasLinkedOrder =
    linkedOrderNumber != null || invoice.order_id != null || invoice.order_type != null;

  return (
    <div
      className={cn(
        'flex w-full transition-colors',
        isSelected && 'border-l-2 border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20'
      )}
    >
      <button
        type="button"
        data-testid={`account-invoice-nav-item-${invoice.id}`}
        onClick={onSelect}
        className="min-w-0 flex-1 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-card-foreground">
            {formatInvLabel(invoice)}
          </span>
          {hasLinkedOrder ? (
            <span
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <OrderDetailsSummary
                invoice={invoice}
                linkedOrderNumber={linkedOrderNumber}
                shortLabel
                badgeClassName="text-[11px] px-2 py-0"
              />
            </span>
          ) : null}
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
            <InvoiceStatusBadge status={invoice.invoice_status} className="text-[11px] px-2 py-0" />
            {!isVoided && isConfirmed && (
              <InvoicePaymentStatusBadge status={invoice.payment_status} className="text-[11px]" />
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className={cn(chipClass, 'capitalize')}>{invoice.invoice_type}</span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-card-foreground">
            {formatInvoiceCurrency(invoice.invoice_amount)}
          </span>
        </div>
      </button>
    </div>
  );
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
        <h2 className="flex min-w-0 items-center gap-2 truncate text-base font-semibold text-card-foreground">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          Invoices
          <span className="font-normal text-muted-foreground">({invoiceCountLabel})</span>
        </h2>
        {listCapped ? (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Showing first {API_LIMITS.FLEXIBLE_1000} of {invoiceCountLabel} — narrow filters to
            see more.
          </p>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">No matching invoices.</p>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <AccountInvoiceListRow
                key={inv.id}
                invoice={inv}
                isSelected={selectedInvoiceId === inv.id}
                linkedOrderNumber={invoiceOrderNumberMap.get(inv.id) ?? null}
                onSelect={() => onSelectInvoice(inv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInvoiceNavigatorPanel;
