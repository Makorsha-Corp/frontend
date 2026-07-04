import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseOrderSummaryStats } from '@/pages/newpages/orders/expenseOrdersOverviewData';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import {
  deriveExpenseOrderStageFromOrder,
  eoStageBadgeClassName,
} from '@/components/newcomponents/customui/orders/expenseOrderMilestones';
import OrdersOverviewTable, {
  type OrdersOverviewTableColumn,
} from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import { Receipt, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseOrdersOverviewPanelProps {
  orders: ExpenseOrder[];
  stats: ExpenseOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  accountName: (id: number | null) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}

const ExpenseOrdersOverviewPanel: React.FC<ExpenseOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  accountName,
  formatCurrency,
  formatDate,
  onSelectOrder,
}) => {
  const formatCompactCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const expenseOrderColumns = useMemo(
    (): OrdersOverviewTableColumn<ExpenseOrder>[] => [
      {
        id: 'expense_number',
        header: 'EXP#',
        cellClassName: 'font-medium',
        cell: (o) => o.expense_number,
      },
      {
        id: 'category',
        header: 'Category',
        cellClassName: 'max-w-[120px] truncate',
        cell: (o) => expenseCategoryLabel(o.expense_category),
      },
      {
        id: 'account',
        header: 'Account',
        cellClassName: 'max-w-[140px] truncate',
        cell: (o) => accountName(o.account_id),
      },
      {
        id: 'stage',
        header: 'Stage',
        cell: (o) => {
          const stage = deriveExpenseOrderStageFromOrder(o);
          return (
            <Badge variant="secondary" className={cn('text-xs', eoStageBadgeClassName(stage))}>
              {stage}
            </Badge>
          );
        },
      },
      {
        id: 'total',
        header: 'Total',
        align: 'right',
        cellClassName: 'font-medium',
        cell: (o) => formatCurrency(Number(o.total_amount)),
      },
      {
        id: 'expense_date',
        header: 'Expense date',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(o.expense_date),
      },
      {
        id: 'due_date',
        header: 'Due date',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(o.due_date),
      },
    ],
    [accountName, formatCurrency, formatDate]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-6">
      {mayTruncate && (
        <p className="text-xs text-muted-foreground">
          Showing the first 1,000 expense orders. Narrow filters or ask for server-side pagination if you need more.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">In current filter scope</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCompactCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Sum of order totals</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.openCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCompactCurrency(stats.openValue)} not completed
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Not invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.notInvoicedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">No linked invoice yet</p>
          </CardContent>
        </Card>
      </div>

      <OrdersOverviewTable
        title="Expense orders"
        subtitle="Click a row to open details"
        columns={expenseOrderColumns}
        rows={orders}
        onRowClick={(o) => onSelectOrder(o.id)}
        emptyIcon={<Receipt className="h-12 w-12 mb-3 opacity-40" />}
        emptyMessage="No expense orders match these filters."
        className="flex-1 min-h-0"
      />
    </div>
  );
};

export default ExpenseOrdersOverviewPanel;
