import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import type { SalesOrder } from '@/types/salesOrder';
import { getSalesOrderListRowBadges } from './salesOrderMilestones';

interface SalesOrderListRowProps {
  order: SalesOrder;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  accountName: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const SalesOrderListRow: React.FC<SalesOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  onDelete,
  accountName,
  formatCurrency,
  formatDate,
}) => {
  const stageBadges = getSalesOrderListRowBadges(order);
  const formattedDate = formatDate(order.order_date);

  return (
    <div
      className={cn(
        'flex w-full items-center transition-colors',
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left px-3.5 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex min-w-0 items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <span className="truncate text-sm font-medium text-card-foreground">{order.sales_order_number}</span>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {stageBadges.map((badge) => (
                <Badge key={badge.label} variant="secondary" className={cn('text-[11px] font-medium', badge.className)}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>

        <div className="mt-0.5 min-w-0 truncate text-xs leading-snug text-muted-foreground" title={`${accountName} · ${formattedDate}`}>
          {accountName} · {formattedDate}
        </div>
      </button>

      {isSelected && onDelete && (
        <div className="flex shrink-0 items-center pr-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete order"
            aria-label={`Delete ${order.sales_order_number}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SalesOrderListRow;
