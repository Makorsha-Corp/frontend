import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList } from 'lucide-react';
import { useGetActiveOrdersForContextQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import type { ActiveOrderRow, ActiveOrdersScope } from '@/types/purchaseOrder';
import { cn } from '@/lib/utils';

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

export interface ActiveOrdersPanelProps {
  scope: ActiveOrdersScope;
  className?: string;
  /** Cap list height / tighter chrome (e.g. dialog). */
  compact?: boolean;
  /** Single-line rows: number + status + PO/TR only (narrow sidebars). */
  minimal?: boolean;
}

function orderHref(row: ActiveOrderRow): string {
  if (row.order_kind === 'purchase') {
    return `/orders/purchase?orderId=${row.id}`;
  }
  if (row.order_kind === 'work') {
    return `/orders/work?orderId=${row.id}`;
  }
  return `/orders/transfer?orderId=${row.id}`;
}

function kindShortLabel(kind: ActiveOrderRow['order_kind']): string {
  if (kind === 'purchase') return 'PO';
  if (kind === 'work') return 'WO';
  return 'TR';
}

/**
 * Active (non-completed) orders for a machine, factory storage, or project component.
 * Data: GET /purchase-orders/active/
 */
export const ActiveOrdersPanel: React.FC<ActiveOrdersPanelProps> = ({
  scope,
  className,
  compact,
  minimal,
}) => {
  const { data = [], isLoading, isError, error } = useGetActiveOrdersForContextQuery(scope);

  if (minimal) {
    const countLabel = isLoading
      ? '…'
      : isError
        ? '—'
        : `${data.length} order${data.length === 1 ? '' : 's'}`;

    return (
      <div className={cn('w-full space-y-2', className)}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-card-foreground">Active orders</span>
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground uppercase tracking-wide">
            {countLabel}
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-[122px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 px-3">
            <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
            <p className="text-xs text-muted-foreground">Loading orders…</p>
          </div>
        ) : isError ? (
          <div className="flex min-h-[122px] items-center rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {(error as { data?: { detail?: string } })?.data?.detail ?? 'Failed to load orders.'}
          </div>
        ) : data.length === 0 ? (
          <div className="flex min-h-[122px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 px-3 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No active orders.</p>
          </div>
        ) : (
          <div className="min-h-[122px]">
            <ul className="min-h-0 max-h-[min(280px,45vh)] overflow-y-auto divide-y divide-border/40 rounded-md border border-border/60 bg-transparent">
              {data.map((row) => {
                const kindShort = kindShortLabel(row.order_kind);
                const statusLabel = row.status_name ?? `#${row.current_status_id}`;
                return (
                  <li key={`${row.order_kind}-${row.id}`}>
                    <Link
                      to={orderHref(row)}
                      title={`${row.number} — ${statusLabel}`}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-muted/20"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-card-foreground">{row.number}</span>
                      <span className="min-w-0 truncate text-xs text-muted-foreground max-w-[45%]">
                        {statusLabel}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 px-1.5 py-0 h-5 text-[10px] font-semibold leading-none"
                      >
                        {kindShort}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <Card className={cn('flex flex-col min-h-0 border-border shadow-sm', compact && 'mb-0')}>
        <CardHeader className="shrink-0 space-y-0 py-3 pb-2">
          <CardTitle className="text-base">Active orders</CardTitle>
        </CardHeader>
        <CardContent className={cn('pt-0 flex-1 min-h-0 flex flex-col', compact ? 'pb-3' : 'pb-4')}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-2" />
              <p className="text-sm">Loading orders…</p>
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {(error as { data?: { detail?: string } })?.data?.detail ?? 'Failed to load orders.'}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-2 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 opacity-40 mb-2" />
              <p className="text-sm">No active orders.</p>
            </div>
          ) : (
            <ul
              className={cn(
                'space-y-2 overflow-y-auto pr-1',
                compact ? 'max-h-[220px]' : 'max-h-[min(40vh,320px)]'
              )}
            >
              {data.map((row) => {
                const amount = row.order_kind !== 'transfer' ? formatAmount(row.total_amount) : null;
                const kindShort = kindShortLabel(row.order_kind);
                const statusLabel = row.status_name ?? `#${row.current_status_id}`;

                return (
                  <li key={`${row.order_kind}-${row.id}`}>
                    <Link
                      to={orderHref(row)}
                      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-card-foreground leading-snug truncate">
                          {row.number}
                        </span>
                        <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-semibold tabular-nums">
                          {kindShort}
                        </Badge>
                      </div>
                      {row.summary ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">{row.summary}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[55%]">{statusLabel}</span>
                        <span className="text-muted-foreground/50" aria-hidden>
                          ·
                        </span>
                        <span className="tabular-nums">#{row.id}</span>
                        <span className="text-muted-foreground/50" aria-hidden>
                          ·
                        </span>
                        <span className="tabular-nums">{new Date(row.created_at).toLocaleDateString()}</span>
                        {amount ? (
                          <>
                            <span className="text-muted-foreground/50" aria-hidden>
                              ·
                            </span>
                            <span className="font-medium text-card-foreground/90 tabular-nums">{amount}</span>
                          </>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveOrdersPanel;
