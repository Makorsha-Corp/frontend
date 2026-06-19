import React from 'react';
import type { TopExpenseCategoryRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel from './OrdersLeaderboardPanel';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';

interface OrdersExpenseCategoriesPanelProps {
  categories: TopExpenseCategoryRow[];
  isLoading?: boolean;
}

const OrdersExpenseCategoriesPanel: React.FC<OrdersExpenseCategoriesPanelProps> = ({
  categories,
  isLoading,
}) => (
  <OrdersLeaderboardPanel
    title="Top expense categories"
    isLoading={isLoading}
    rows={categories.map((c) => ({
      id: c.category,
      label: expenseCategoryLabel(c.category),
      value: Number(c.total_spend),
      primary: `${c.order_count} expense${c.order_count === 1 ? '' : 's'}`,
    }))}
    emptyMessage="No expenses in range (or factory filter hides expenses)"
  />
);

export default OrdersExpenseCategoriesPanel;
