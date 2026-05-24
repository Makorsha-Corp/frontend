import React from 'react';
import { Button } from '@/components/ui/button';
import type { WorkOrder } from '@/types/workOrder';
import WorkOrderListRow from '@/components/newcomponents/customui/orders/WorkOrderListRow';
import { ORDER_LIST_WIDTH } from '@/components/newcomponents/customui/orders/orderListConstants';
import { Wrench, Plus, Loader2, X } from 'lucide-react';

export interface WorkOrderNavigatorPanelProps {
  onClose: () => void;
  filteredOrders: WorkOrder[];
  selectedOrderId: number | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onSelectOrder: (id: number) => void;
  onAddOrder: () => void;
  formatDate: (d: string | null | undefined) => string;
}

const WorkOrderNavigatorPanel: React.FC<WorkOrderNavigatorPanelProps> = ({
  onClose,
  filteredOrders,
  selectedOrderId,
  isLoading,
  hasActiveFilters,
  onSelectOrder,
  onAddOrder,
  formatDate,
}) => {
  return (
    <div
      className="shrink-0 flex flex-col h-full border-r border-border bg-card"
      style={{ width: ORDER_LIST_WIDTH }}
    >
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-card-foreground">
          Orders
          <span className="ml-2 font-normal text-muted-foreground">
            ({filteredOrders.length})
          </span>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close navigator</span>
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Wrench className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {hasActiveFilters ? 'No orders match your filters.' : 'No work orders yet.'}
            </p>
            {!hasActiveFilters && (
              <Button
                type="button"
                onClick={onAddOrder}
                className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Work Order
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((o) => (
              <WorkOrderListRow
                key={o.id}
                order={o}
                isSelected={selectedOrderId === o.id}
                onClick={() => onSelectOrder(o.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderNavigatorPanel;
