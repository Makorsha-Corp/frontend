import React from 'react';
import { Button } from '@/components/ui/button';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import PurchaseOrderListRow from '@/components/newcomponents/customui/orders/PurchaseOrderListRow';
import { ORDER_LIST_WIDTH } from '@/components/newcomponents/customui/orders/orderListConstants';
import { ShoppingCart, Plus, Loader2 } from 'lucide-react';

export interface PurchaseOrderNavigatorPanelProps {
  filteredOrders: PurchaseOrder[];
  selectedOrderId: number | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onSelectOrder: (id: number) => void;
  onAddOrder: () => void;
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  destinationLabel: (order: PurchaseOrder) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const PurchaseOrderNavigatorPanel: React.FC<PurchaseOrderNavigatorPanelProps> = ({
  filteredOrders,
  selectedOrderId,
  isLoading,
  hasActiveFilters,
  onSelectOrder,
  onAddOrder,
  accountName,
  statusLabel,
  destinationLabel,
  formatCurrency,
  formatDate,
}) => {
  return (
    <div
      className="shrink-0 flex flex-col h-full border-r border-border bg-card"
      style={{ width: ORDER_LIST_WIDTH }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-card-foreground">
          Orders
          <span className="ml-2 font-normal text-muted-foreground">
            ({filteredOrders.length})
          </span>
        </h2>
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
                accountName={accountName(o.account_id)}
                statusLabel={statusLabel(o.current_status_id)}
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
