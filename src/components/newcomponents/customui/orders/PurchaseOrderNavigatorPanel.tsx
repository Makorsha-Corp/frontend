import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import PurchaseOrderListRow from '@/components/newcomponents/customui/orders/PurchaseOrderListRow';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { cn } from '@/lib/utils';
import { ShoppingCart, Plus, Loader2, SlidersHorizontal } from 'lucide-react';

export interface PurchaseOrderNavigatorPanelProps {
  filteredOrders: PurchaseOrder[];
  selectedOrderId: number | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  hasHiddenCompleteOrders?: boolean;
  onSelectOrder: (id: number) => void;
  onDeleteOrder?: (order: PurchaseOrder) => void;
  onAddOrder: () => void;
  accountName: (id: number) => string;
  destinationLabel: (order: PurchaseOrder) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  className?: string;
}

const PurchaseOrderNavigatorPanel: React.FC<PurchaseOrderNavigatorPanelProps> = ({
  filteredOrders,
  selectedOrderId,
  isLoading,
  hasActiveFilters,
  activeFilterCount,
  filtersOpen,
  onToggleFilters,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  hasHiddenCompleteOrders = false,
  onSelectOrder,
  onDeleteOrder,
  onAddOrder,
  accountName,
  destinationLabel,
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
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h2 className="text-base font-semibold text-card-foreground min-w-0 truncate">
            Orders
            <span className="ml-2 font-normal text-muted-foreground">
              ({filteredOrders.length})
            </span>
          </h2>
          <div
            className="ml-4 flex shrink-0 items-center gap-1.5"
            title="Show complete orders"
          >
            <Switch
              id="po-show-complete-nav"
              checked={showCompleteOrders}
              onCheckedChange={onShowCompleteOrdersChange}
              className="scale-90"
              aria-label="Show complete orders"
            />
            <Label
              htmlFor="po-show-complete-nav"
              className="cursor-pointer text-xs font-normal text-muted-foreground whitespace-nowrap"
            >
              Complete
            </Label>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="po-filters-bar"
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

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {hasActiveFilters
                ? 'No orders match your filters.'
                : hasHiddenCompleteOrders
                  ? 'No open orders. Turn on Complete to see finished purchase orders.'
                  : 'No purchase orders yet.'}
            </p>
            {!hasActiveFilters && (
              <Button
                type="button"
                onClick={onAddOrder}
                className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Purchase Order
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((o) => (
              <PurchaseOrderListRow
                key={o.id}
                order={o}
                isSelected={selectedOrderId === o.id}
                onClick={() => onSelectOrder(o.id)}
                onDelete={
                  selectedOrderId === o.id && onDeleteOrder
                    ? () => onDeleteOrder(o)
                    : undefined
                }
                accountName={o.account_id != null ? accountName(o.account_id) : '—'}
                destinationLabel={destinationLabel(o)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderNavigatorPanel;
