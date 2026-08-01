import React from 'react';
import { Link } from 'react-router-dom';
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { ItemIncomingSummary } from '@/types/inventoryIncoming';

interface IncomingQtyCellProps {
  summary: ItemIncomingSummary | undefined;
  itemUnit?: string | null;
  /** Only STORAGE rows show incoming qty; others render em dash. */
  showIncoming: boolean;
}

function orderHref(orderKind: 'purchase' | 'transfer', orderId: number): string {
  if (orderKind === 'purchase') {
    return `/orders/purchase?orderId=${orderId}`;
  }
  return `/orders/transfer?orderId=${orderId}`;
}

function formatQty(value: number | string): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

const IncomingQtyCell: React.FC<IncomingQtyCellProps> = ({ summary, itemUnit, showIncoming }) => {
  if (!showIncoming) {
    return <span className="text-muted-foreground">—</span>;
  }

  const total = summary ? formatQty(summary.total_pending_qty) : 0;
  if (!summary || total <= 0 || summary.order_count <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const unit = itemUnit?.trim();
  const orderCountLabel = `${summary.order_count} order${summary.order_count !== 1 ? 's' : ''}`;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-start gap-0.5 text-left underline-offset-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="tabular-nums text-sm font-medium text-blue-600 dark:text-blue-400">
            +{total}
          </span>
          <span className="text-[11px] text-muted-foreground">{orderCountLabel}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[200] w-[min(18rem,calc(100vw-2rem))] p-2"
        >
          <ul className="space-y-1">
            {summary.orders.map((line) => {
              const qty = formatQty(line.pending_qty);
              const qtyLabel = unit ? `${qty} ${unit}` : String(qty);
              const isPurchase = line.order_kind === 'purchase';
              return (
                <li key={`${line.order_kind}-${line.order_id}`}>
                  <Link
                    to={orderHref(line.order_kind, line.order_id)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        isPurchase
                          ? 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300'
                          : 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300',
                      )}
                    >
                      {isPurchase ? 'PO' : 'TR'}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {line.order_number}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {line.status_name ?? 'Open'}
                    </span>
                    <span className="shrink-0 tabular-nums font-medium text-foreground">+{qtyLabel}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
};

export default IncomingQtyCell;
