import React from 'react';
import { Button } from '@/components/ui/button';
import type { SalesOrder } from '@/types/salesOrder';
import SalesOrderListRow from '@/components/newcomponents/customui/orders/SalesOrderListRow';
import { ShowCompleteOrdersSwitchControl } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { cn } from '@/lib/utils';
import { ClipboardList, Plus, Loader2 } from 'lucide-react';

export interface SalesOrderNavigatorPanelProps {
  orders: SalesOrder[];
  ordersTotal: number;
  isLoading: boolean;
  isFetching?: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  selectedOrderId: number | null;
  hasActiveFilters: boolean;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  emptyHintNoOpen?: boolean;
  onSelectOrder: (id: number) => void;
  onAddOrder: () => void;
  accountName: (id: number) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  className?: string;
}

const SalesOrderNavigatorPanel: React.FC<SalesOrderNavigatorPanelProps> = ({
  orders,
  ordersTotal,
  isLoading,
  isFetching = false,
  hasMore,
  onLoadMore,
  selectedOrderId,
  hasActiveFilters,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  emptyHintNoOpen = false,
  onSelectOrder,
  onAddOrder,
  accountName,
  formatCurrency,
  formatDate,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-border bg-card w-full min-w-0 lg:w-[360px]',
        className
      )}
    >
      {/* Header */}
      <div className={cn(ORDER_PANEL_HEADER_CLASS, 'justify-between gap-2 px-4')}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="text-base font-semibold text-card-foreground min-w-0 truncate">
            Orders
            <span className="ml-2 font-normal text-muted-foreground">({ordersTotal})</span>
          </h2>
          <ShowCompleteOrdersSwitchControl
            checked={showCompleteOrders}
            onCheckedChange={onShowCompleteOrdersChange}
            context="list"
            tooltipSide="bottom"
            tooltipAlign="start"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {hasActiveFilters
                ? 'No orders match your search.'
                : emptyHintNoOpen
                  ? 'No open orders. Show completed orders using the toggle.'
                  : 'No sales orders yet.'}
            </p>
            {!hasActiveFilters && (
              <Button type="button" onClick={onAddOrder} className="mt-4 bg-brand-primary hover:bg-brand-primary-hover">
                <Plus className="mr-2 h-4 w-4" />
                Add Sales Order
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <SalesOrderListRow
                key={o.id}
                order={o}
                isSelected={selectedOrderId === o.id}
                onClick={() => onSelectOrder(o.id)}
                accountName={accountName(o.account_id)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="shrink-0 border-t border-border p-3">
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onLoadMore} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default SalesOrderNavigatorPanel;
