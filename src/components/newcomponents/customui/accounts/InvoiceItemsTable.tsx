import React from 'react';
import { Loader2, Package } from 'lucide-react';
import { useGetInvoiceItemsQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';
import { cn } from '@/lib/utils';

interface InvoiceItemsTableProps {
  invoiceId: number;
  /** No outer box — parent provides Card or bordered shell */
  embedded?: boolean;
}

const shellClass = (embedded: boolean) =>
  embedded ? 'space-y-3' : 'rounded-md border border-border bg-muted/20 px-4 py-3 space-y-3';

const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ invoiceId, embedded = false }) => {
  const { data: items = [], isLoading } = useGetInvoiceItemsQuery(invoiceId);

  if (isLoading) {
    return (
      <div className={cn(shellClass(embedded))}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading items…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn(shellClass(embedded))}>
        <p className="text-sm text-muted-foreground">No items recorded for this invoice.</p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + Number(item.line_subtotal), 0);

  return (
    <div className={cn(shellClass(embedded))}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          Invoice items
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? 'line' : 'lines'}
        </span>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-card-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {Number(item.quantity)}
                {item.unit ? ` ${item.unit}` : ''} × {formatInvoiceCurrency(Number(item.unit_price))}
              </p>
            </div>
            <p className="shrink-0 font-medium tabular-nums text-card-foreground">
              {formatInvoiceCurrency(Number(item.line_subtotal))}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-2 text-sm">
        <span className="text-muted-foreground">Items total</span>
        <span className="font-semibold tabular-nums text-card-foreground">
          {formatInvoiceCurrency(total)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
