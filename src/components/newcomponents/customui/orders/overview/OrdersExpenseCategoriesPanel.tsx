import React from 'react';
import { useTranslation } from 'react-i18next';
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
}) => {
  const { t } = useTranslation('orders');
  return (
    <OrdersLeaderboardPanel
      title={t('topExpenseCategories')}
    isLoading={isLoading}
    rows={categories.map((c) => ({
      id: c.category,
      label: expenseCategoryLabel(c.category),
      value: Number(c.total_spend),
      primary: t('overviewExpenseCount', { count: c.order_count }),
    }))}
      emptyMessage={t('noExpensesInRange')}
    />
  );
};

export default OrdersExpenseCategoriesPanel;
