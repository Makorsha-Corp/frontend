import React, { useState } from 'react';
import { Truck, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TopAccountRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel, { type LeaderboardRow } from './OrdersLeaderboardPanel';

interface OrdersTopAccountsPanelProps {
  vendors: TopAccountRow[];
  customers: TopAccountRow[];
  isLoading?: boolean;
}

type AccountsTab = 'vendors' | 'customers';

const TAB_LABELS: Record<AccountsTab, string> = {
  vendors: 'Vendors',
  customers: 'Customers',
};

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
}) => {
  const [tab, setTab] = useState<AccountsTab>('vendors');

  return (
    <Card className="border-border h-full">
      <Tabs value={tab} onValueChange={(v) => setTab(v as AccountsTab)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base text-card-foreground">Accounts</CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{TAB_LABELS[tab]}</span>
            <TabsList className="h-8 shrink-0">
              <TabsTrigger
                value="vendors"
                className="h-7 w-7 p-0"
                aria-label="Vendors"
                title="Vendors"
              >
                <Truck className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="h-7 w-7 p-0"
                aria-label="Customers"
                title="Customers"
              >
                <Users className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TabsContent value="vendors" className="mt-0">
            <OrdersLeaderboardPanel
              title=""
              embedded
              rows={toRows(vendors)}
              isLoading={isLoading}
              emptyMessage="No vendor spend in range"
            />
          </TabsContent>
          <TabsContent value="customers" className="mt-0">
            <OrdersLeaderboardPanel
              title=""
              embedded
              rows={toRows(customers)}
              isLoading={isLoading}
              emptyMessage="No customer sales in range"
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default OrdersTopAccountsPanel;
