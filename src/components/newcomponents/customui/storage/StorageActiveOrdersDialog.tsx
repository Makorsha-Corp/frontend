import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, ArrowUpRight, ClipboardList, Loader2, ShoppingCart } from 'lucide-react';
import { useGetActiveOrdersForContextQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import type { ActiveOrderRow } from '@/types/purchaseOrder';
import { cn } from '@/lib/utils';

type OrderFilter = 'all' | 'purchase' | 'transfer';

interface StorageActiveOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number | null;
  factoryLabel?: string | null;
}

function formatAmount(v: string | number | null | undefined): string | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function orderHref(row: ActiveOrderRow): string {
  if (row.order_kind === 'purchase') {
    return `/orders/purchase?orderId=${row.id}`;
  }
  return `/orders/transfer?orderId=${row.id}`;
}

const FILTER_OPTIONS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'transfer', label: 'Transfer' },
];

const StorageActiveOrdersDialog: React.FC<StorageActiveOrdersDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  factoryLabel,
}) => {
  const [filter, setFilter] = useState<OrderFilter>('all');

  const { data = [], isLoading, isError, error } = useGetActiveOrdersForContextQuery(
    { factoryId: factoryId! },
    { skip: factoryId == null || !open }
  );

  const purchaseCount = useMemo(
    () => data.filter((row) => row.order_kind === 'purchase').length,
    [data]
  );
  const transferCount = useMemo(
    () => data.filter((row) => row.order_kind === 'transfer').length,
    [data]
  );

  const filteredRows = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((row) => row.order_kind === filter);
  }, [data, filter]);

  const contextLabel = factoryLabel?.trim() || 'this factory';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFilter('all');
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border bg-muted/25 px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 pr-8">
            <DialogTitle className="flex items-center gap-2.5 text-card-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/20">
                <ClipboardList className="h-4 w-4 text-brand-primary" />
              </span>
              Active orders
            </DialogTitle>
            <DialogDescription>
              Open purchase and transfer orders affecting storage at {contextLabel}.
            </DialogDescription>
          </DialogHeader>

          {!isLoading && !isError ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium tabular-nums text-card-foreground">
                {data.length} total
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-medium tabular-nums text-blue-700 dark:text-blue-300">
                <ShoppingCart className="h-3 w-3" />
                {purchaseCount} purchase
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-medium tabular-nums text-amber-700 dark:text-amber-300">
                <ArrowLeftRight className="h-3 w-3" />
                {transferCount} transfer
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex gap-1 border-b border-border bg-background px-4 py-2">
          {FILTER_OPTIONS.map((option) => {
            const count =
              option.id === 'all'
                ? data.length
                : option.id === 'purchase'
                  ? purchaseCount
                  : transferCount;
            const active = filter === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-card-foreground'
                )}
              >
                {option.label}
                {!isLoading && !isError ? (
                  <span
                    className={cn(
                      'tabular-nums',
                      active ? 'text-brand-primary/80' : 'text-muted-foreground/80'
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="max-h-[min(58vh,440px)] overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <p className="text-sm">Loading orders…</p>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {(error as { data?: { detail?: string } })?.data?.detail ?? 'Failed to load orders.'}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/35" />
              <p className="text-sm font-medium text-card-foreground">
                {filter === 'all' ? 'No active orders' : `No active ${filter} orders`}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {filter === 'all'
                  ? 'Completed orders are hidden from this view.'
                  : 'Try another filter or check back when new orders are created.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredRows.map((row) => {
                const isPurchase = row.order_kind === 'purchase';
                const kindShort = isPurchase ? 'PO' : 'TR';
                const statusLabel = row.status_name ?? `#${row.current_status_id}`;
                const amount = isPurchase ? formatAmount(row.total_amount) : null;

                return (
                  <li key={`${row.order_kind}-${row.id}`}>
                    <Link
                      to={orderHref(row)}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-start gap-3 rounded-lg border border-border/80 bg-card px-3 py-3 transition-colors hover:border-brand-primary/35 hover:bg-brand-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase tracking-wide',
                          isPurchase
                            ? 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300'
                            : 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300'
                        )}
                      >
                        {kindShort}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-card-foreground">
                            {row.number}
                          </span>
                          <Badge
                            variant="secondary"
                            className="shrink-0 max-w-[45%] truncate text-[10px] font-medium"
                          >
                            {statusLabel}
                          </Badge>
                        </div>

                        {row.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {row.summary}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="tabular-nums">
                            {new Date(row.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-muted-foreground/40" aria-hidden>
                            ·
                          </span>
                          <span className="tabular-nums">#{row.id}</span>
                          {amount ? (
                            <>
                              <span className="text-muted-foreground/40" aria-hidden>
                                ·
                              </span>
                              <span className="font-medium tabular-nums text-card-foreground/90">
                                {amount}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-muted/15 px-4 py-2.5">
          <p className="text-center text-[11px] text-muted-foreground">
            Select an order to open its detail page
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageActiveOrdersDialog;
