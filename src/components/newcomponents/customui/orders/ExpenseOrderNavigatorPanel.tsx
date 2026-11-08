import React from 'react';
import { Button } from '@/components/ui/button';
import type { ExpenseOrder } from '@/types/expenseOrder';
import ExpenseOrderListRow from '@/components/newcomponents/customui/orders/ExpenseOrderListRow';
import OrderHubPagination from '@/components/newcomponents/customui/orders/OrderHubPagination';
import { ShowCompleteOrdersSwitchControl } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { cn } from '@/lib/utils';
import { Receipt, Plus, Loader2 } from 'lucide-react';
import { TourSampleListRow } from '@/components/newcomponents/customui/helpGuides/TourSampleChrome';

export interface ExpenseOrderNavigatorPanelProps {
  orders: ExpenseOrder[];
  ordersTotal: number;
  listPage: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  selectedOrderId: number | null;
  offPageSelectedLabel?: string | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  emptyHintNoOpen?: boolean;
  onSelectOrder: (id: number) => void;
  onDeleteOrder?: (order: ExpenseOrder) => void;
  onAddOrder: () => void;
  accountName: (id: number | null) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  className?: string;
  showSample?: boolean;
  hideRealOrders?: boolean;
  sampleSelected?: boolean;
  onSelectSample?: () => void;
}

const ExpenseOrderNavigatorPanel: React.FC<ExpenseOrderNavigatorPanelProps> = ({
  orders,
  ordersTotal,
  listPage,
  isFetching = false,
  onPageChange,
  selectedOrderId,
  isLoading,
  hasActiveFilters,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  offPageSelectedLabel = null,
  emptyHintNoOpen = false,
  onSelectOrder,
  onDeleteOrder,
  onAddOrder,
  accountName,
  formatCurrency,
  formatDate,
  className,
  showSample = false,
  hideRealOrders = false,
  sampleSelected = false,
  onSelectSample,
}) => {
  const tourListOnly = showSample && hideRealOrders;
  return (
    <div
      data-help-tour="expense.navigator"
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-border bg-card w-full min-w-0 lg:w-[360px]',
        className
      )}
    >
      <div className={cn(ORDER_PANEL_HEADER_CLASS, 'gap-2 px-4')}>
        <h2 className="text-base font-semibold text-card-foreground min-w-0 truncate">
          Orders
          <span className="ml-2 font-normal text-muted-foreground">
            ({ordersTotal})
          </span>
        </h2>
        <ShowCompleteOrdersSwitchControl
          checked={showCompleteOrders}
          onCheckedChange={onShowCompleteOrdersChange}
          context="list"
          tooltipSide="bottom"
          tooltipAlign="start"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {showSample && onSelectSample ? (
          <TourSampleListRow
            title="Sample expense"
            subtitle="Preview only — not saved"
            selected={sampleSelected}
            onSelect={onSelectSample}
          />
        ) : null}
        {tourListOnly ? null : isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {hasActiveFilters
                ? 'No orders match your filters.'
                : emptyHintNoOpen
                  ? 'No open orders. Show completed orders using the toggle.'
                  : 'No expense orders yet.'}
            </p>
            {!hasActiveFilters && (
              <Button
                type="button"
                onClick={onAddOrder}
                className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense Order
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {offPageSelectedLabel ? (
              <div className="border-l-2 border-brand-primary bg-brand-primary/10 px-4 py-3 text-sm dark:bg-brand-primary/20">
                <p className="font-medium text-card-foreground">{offPageSelectedLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Selected · not on this page</p>
              </div>
            ) : null}
            {orders.map((o) => (
              <ExpenseOrderListRow
                key={o.id}
                order={o}
                isSelected={selectedOrderId === o.id}
                onClick={() => onSelectOrder(o.id)}
                onDelete={
                  selectedOrderId === o.id && onDeleteOrder ? () => onDeleteOrder(o) : undefined
                }
                accountName={accountName(o.account_id)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {!tourListOnly && ordersTotal > 0 ? (
        <OrderHubPagination
          page={listPage}
          total={ordersTotal}
          isFetching={isFetching}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
};

export default ExpenseOrderNavigatorPanel;
