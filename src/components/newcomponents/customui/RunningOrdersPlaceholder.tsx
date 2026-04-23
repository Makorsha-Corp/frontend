import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList } from 'lucide-react';
import { useGetActiveOrdersForContextQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import type { ActiveOrderRow, ActiveOrdersScope } from '@/types/purchaseOrder';
import { cn } from '@/lib/utils';

export interface ActiveOrdersPanelProps {
  scope: ActiveOrdersScope;
  className?: string;
  /** Shorter panel when embedded in dialogs */
  compact?: boolean;
}

function scopeDescription(scope: ActiveOrdersScope): string {
  if ('machineId' in scope) return 'Active purchase and transfer orders for this machine.';
  if ('factoryId' in scope) return 'Active purchase and transfer orders for this factory’s storage.';
  return 'Active purchase and transfer orders for this project component.';
}

function orderHref(row: ActiveOrderRow): string {
  if (row.order_kind === 'purchase') {
    return `/orders/purchase?orderId=${row.id}`;
  }
  return `/orders/transfer?orderId=${row.id}`;
}

/**
 * Active (non-completed) orders for a machine, factory storage, or project component.
 * Data: GET /purchase-orders/active/
 */
export const ActiveOrdersPanel: React.FC<ActiveOrdersPanelProps> = ({ scope, className, compact }) => {
  const { data = [], isLoading, isError, error } = useGetActiveOrdersForContextQuery(scope);

  const title = useMemo(() => {
    if ('machineId' in scope) return 'Active orders';
    if ('factoryId' in scope) return 'Active orders';
    return 'Active orders';
  }, [scope]);

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <Card className={cn('flex flex-col min-h-0 border-border shadow-sm', compact && 'mb-0')}>
        <CardHeader className="shrink-0 py-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{scopeDescription(scope)}</CardDescription>
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
              <p className="text-sm">No active orders for this context.</p>
            </div>
          ) : (
            <ul
              className={cn(
                'space-y-2 overflow-y-auto pr-1',
                compact ? 'max-h-[220px]' : 'max-h-[min(40vh,320px)]'
              )}
            >
              {data.map((row) => (
                <li key={`${row.order_kind}-${row.id}`}>
                  <Link
                    to={orderHref(row)}
                    className="flex flex-col gap-1 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-card-foreground truncate">{row.number}</span>
                      <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                        {row.order_kind}
                      </Badge>
                    </div>
                    {row.summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">{row.summary}</p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{row.status_name ?? `Status #${row.current_status_id}`}</span>
                      <span className="shrink-0 tabular-nums">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveOrdersPanel;
