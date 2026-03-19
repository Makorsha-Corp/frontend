import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetExpenseOrderItemsQuery } from '@/features/expenseOrders/expenseOrdersApi';
import type { ExpenseOrder } from '@/types/expenseOrder';

interface ExpenseOrderListRowProps {
  order: ExpenseOrder;
  isSelected: boolean;
  onClick: () => void;
  accountName: string;
  statusLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const ExpenseOrderListRow: React.FC<ExpenseOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  accountName,
  statusLabel,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetExpenseOrderItemsQuery(order.id);
  const itemCount = items.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.expense_number}</span>
        <Badge variant="secondary" className="text-xs shrink-0">{statusLabel}</Badge>
      </div>
      <div className="text-sm text-muted-foreground truncate mt-0.5">{order.expense_category}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
        <span>{formatDate(order.expense_date)}</span>
        <span>•</span>
        <span>{accountName || '—'}</span>
        <span>•</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="text-xs font-medium text-card-foreground mt-0.5">{formatCurrency(order.total_amount)}</div>
    </button>
  );
};

export default ExpenseOrderListRow;
