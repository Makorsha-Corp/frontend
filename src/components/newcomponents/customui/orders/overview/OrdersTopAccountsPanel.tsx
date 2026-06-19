import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TopAccountRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel, { type LeaderboardRow } from './OrdersLeaderboardPanel';

interface OrdersTopAccountsPanelProps {
  vendors: TopAccountRow[];
  customers: TopAccountRow[];
  isLoading?: boolean;
}

function toRows(accounts: TopAccountRow[]): LeaderboardRow[] {
  return accounts.map((a) => ({
    id: a.account_id,
    label: a.account_name,
    value: Number(a.total_spend),
    primary: `${a.order_count} order${a.order_count === 1 ? '' : 's'}`,
  }));
}

const OrdersTopAccountsPanel: React.FC<OrdersTopAccountsPanelProps> = ({
  vendors,
  customers,
  isLoading,
}) => (
  <Card className="border-border h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-base text-card-foreground">Accounts</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="vendors">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="vendors" className="mt-3">
          <OrdersLeaderboardPanel
            title=""
            embedded
            rows={toRows(vendors)}
            isLoading={isLoading}
            emptyMessage="No vendor spend in range"
          />
        </TabsContent>
        <TabsContent value="customers" className="mt-3">
          <OrdersLeaderboardPanel
            title=""
            embedded
            rows={toRows(customers)}
            isLoading={isLoading}
            emptyMessage="No customer sales in range"
          />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

export default OrdersTopAccountsPanel;
