import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TopAccountRow, TopExpenseCategoryRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel, { type LeaderboardRow } from './OrdersLeaderboardPanel';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';

interface OrdersOverviewCompactInsightsPanelProps {
  vendors: TopAccountRow[];
  customers: TopAccountRow[];
  categories: TopExpenseCategoryRow[];
  isLoading?: boolean;
}

function toAccountRows(accounts: TopAccountRow[]): LeaderboardRow[] {
  return accounts.map((a) => ({
    id: a.account_id,
    label: a.account_name,
    value: Number(a.total_spend),
    primary: `${a.order_count} order${a.order_count === 1 ? '' : 's'}`,
  }));
}

const OrdersOverviewCompactInsightsPanel: React.FC<OrdersOverviewCompactInsightsPanelProps> = ({
  vendors,
  customers,
  categories,
  isLoading,
}) => (
  <Card className="border-border h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-base text-card-foreground">Accounts & categories</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="vendors">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="vendors" className="mt-3">
          <OrdersLeaderboardPanel
            title=""
            embedded
            rows={toAccountRows(vendors)}
            isLoading={isLoading}
            emptyMessage="No vendor spend in range"
          />
        </TabsContent>
        <TabsContent value="customers" className="mt-3">
          <OrdersLeaderboardPanel
            title=""
            embedded
            rows={toAccountRows(customers)}
            isLoading={isLoading}
            emptyMessage="No customer sales in range"
          />
        </TabsContent>
        <TabsContent value="categories" className="mt-3">
          <OrdersLeaderboardPanel
            title=""
            embedded
            rows={categories.map((c) => ({
              id: c.category,
              label: expenseCategoryLabel(c.category),
              value: Number(c.total_spend),
              primary: `${c.order_count} expense${c.order_count === 1 ? '' : 's'}`,
            }))}
            isLoading={isLoading}
            emptyMessage="No expenses in range"
          />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

export default OrdersOverviewCompactInsightsPanel;
