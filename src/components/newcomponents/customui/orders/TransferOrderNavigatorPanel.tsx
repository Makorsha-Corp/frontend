import React from 'react';
import { Button } from '@/components/ui/button';
import type { TransferOrder } from '@/types/transferOrder';
import TransferOrderListRow from '@/components/newcomponents/customui/orders/TransferOrderListRow';
import OrderHubPagination from '@/components/newcomponents/customui/orders/OrderHubPagination';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Plus, Loader2, SlidersHorizontal } from 'lucide-react';

export interface TransferOrderNavigatorPanelProps {
  orders: TransferOrder[];
  ordersTotal: number;
  listPage: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  selectedOrderId: number | null;
  offPageSelectedLabel?: string | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  emptyHintNoOpen?: boolean;
  onSelectOrder: (id: number) => void;
  onDeleteOrder?: (order: TransferOrder) => void;
  onAddOrder: () => void;
  routeLabel: (order: TransferOrder) => React.ReactNode;
  formatDate: (d: string | null | undefined) => string;
  className?: string;
}

const TransferOrderNavigatorPanel: React.FC<TransferOrderNavigatorPanelProps> = ({
  orders,
  ordersTotal,
  listPage,
  isFetching = false,
  onPageChange,
  selectedOrderId,
  isLoading,
  hasActiveFilters,
  activeFilterCount,
  filtersOpen,
  onToggleFilters,
  offPageSelectedLabel = null,
  emptyHintNoOpen = false,
  onSelectOrder,
  onDeleteOrder,
  onAddOrder,
  routeLabel,
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
      <div className={cn(ORDER_PANEL_HEADER_CLASS, 'justify-between gap-2 px-4')}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h2 className="text-base font-semibold text-card-foreground min-w-0 truncate">
            Orders
            <span className="ml-2 font-normal text-muted-foreground">
              ({ordersTotal})
            </span>
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="tr-filters-bar"
          className={cn(
            'shrink-0 h-8 border-border bg-background',
            filtersOpen &&
              'bg-gray-100 text-foreground hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:border-gray-600',
            activeFilterCount > 0 && !filtersOpen && 'border-brand-primary/40 text-brand-primary'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {hasActiveFilters
                ? 'No orders match your filters.'
                : emptyHintNoOpen
                  ? 'No open orders. Show completed orders using the toggle.'
                  : 'No transfer orders yet.'}
            </p>
            {!hasActiveFilters && (
              <Button
                type="button"
                onClick={onAddOrder}
                className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transfer Order
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
              <TransferOrderListRow
                key={o.id}
                order={o}
                isSelected={selectedOrderId === o.id}
                onClick={() => onSelectOrder(o.id)}
                onDelete={
                  selectedOrderId === o.id && onDeleteOrder
                    ? () => onDeleteOrder(o)
                    : undefined
                }
                routeLabel={routeLabel(o)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {ordersTotal > 0 ? (
        <div className="shrink-0 border-t border-border px-3 py-2">
          <OrderHubPagination
            page={listPage}
            total={ordersTotal}
            isFetching={isFetching}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
};

export default TransferOrderNavigatorPanel;
