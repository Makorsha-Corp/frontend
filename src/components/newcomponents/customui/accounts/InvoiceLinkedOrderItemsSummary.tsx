import React from 'react';
import { Loader2, Package } from 'lucide-react';
import type { PurchaseOrderItem } from '@/types/purchaseOrder';
import type { ExpenseOrderItem } from '@/types/expenseOrder';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';

export interface InvoiceLinkedOrderItemsSummaryProps {
  poItems?: PurchaseOrderItem[];
  expenseItems?: ExpenseOrderItem[];
  isLoading?: boolean;
}

const InvoiceLinkedOrderItemsSummary: React.FC<InvoiceLinkedOrderItemsSummaryProps> = ({
  poItems = [],
  expenseItems = [],
  isLoading = false,
}) => {
  const isPurchase = poItems.length > 0;
  const items = isPurchase ? poItems : expenseItems;
  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(
        isPurchase
          ? (item as PurchaseOrderItem).line_subtotal
          : (item as ExpenseOrderItem).line_subtotal ?? 0
      ),
    0
  );

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading order items…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-muted/20 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          {isPurchase ? 'Order items' : 'Expense lines'}
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? 'line' : 'lines'}
        </span>
      </div>

      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
        {isPurchase
          ? poItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-card-foreground">
                    {item.item_name ?? `Item #${item.item_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {Number(item.quantity_ordered)}
                    {item.item_unit ? ` ${item.item_unit}` : ''} ×{' '}
                    {formatInvoiceCurrency(Number(item.unit_price))}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-card-foreground">
                  {formatInvoiceCurrency(Number(item.line_subtotal))}
                </p>
              </div>
            ))
          : expenseItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-card-foreground">
                    {item.description ?? `Line #${item.line_number}`}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ''}
                    {item.unit_price != null
                      ? ` × ${formatInvoiceCurrency(Number(item.unit_price))}`
                      : ''}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-card-foreground">
                  {formatInvoiceCurrency(Number(item.line_subtotal ?? 0))}
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

export default InvoiceLinkedOrderItemsSummary;
