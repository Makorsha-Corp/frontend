import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useGetExpenseOrderItemsQuery } from '@/features/expenseOrders/expenseOrdersApi';
import type { ExpenseOrder } from '@/types/expenseOrder';
import {
  deriveExpenseOrderStageFromOrder,
  eoStageBadgeClassName,
} from './expenseOrderMilestones';
import { expenseCategoryLabel } from './expenseOrderConstants';

interface ExpenseOrderListRowProps {
  order: ExpenseOrder;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  accountName: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const ExpenseOrderListRow: React.FC<ExpenseOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  onDelete,
  accountName,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetExpenseOrderItemsQuery(order.id);
  const itemCount = items.length;
  const stageName = deriveExpenseOrderStageFromOrder(order);

  const chipClass =
    'inline-flex items-center bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[11px]';

  return (
    <div
      className={cn(
        'flex w-full transition-colors',
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-card-foreground truncate">{order.expense_number}</span>
          <Badge
            variant="secondary"
            className={cn('text-[11px] shrink-0 font-medium', eoStageBadgeClassName(stageName))}
          >
            {stageName}
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground truncate mt-1">
          {expenseCategoryLabel(order.expense_category)}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={chipClass}>{formatDate(order.expense_date)}</span>
          <span className={chipClass}>{accountName || '—'}</span>
          <span className={chipClass}>
            {itemCount} expense{itemCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="text-xs font-medium text-card-foreground mt-2">
          {formatCurrency(order.total_amount)}
        </div>
      </button>

      {onDelete && (
        <div className="flex shrink-0 items-center pr-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete expense order"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpenseOrderListRow;
