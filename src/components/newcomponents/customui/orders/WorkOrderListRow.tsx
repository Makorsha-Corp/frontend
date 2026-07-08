import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetWorkOrderItemsQuery } from '@/features/workOrders/workOrdersApi';
import type { WorkOrder } from '@/types/workOrder';

interface WorkOrderListRowProps {
  order: WorkOrder;
  isSelected: boolean;
  onClick: () => void;
  formatDate: (d: string | null | undefined) => string;
}

const WorkOrderListRow: React.FC<WorkOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  formatDate,
}) => {
  const { data: items = [] } = useGetWorkOrderItemsQuery(order.id);
  const itemCount = items.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.work_order_number}</span>
        <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs shrink-0">
          {order.status}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground truncate mt-0.5">{order.title}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
        <span>{formatDate(order.start_date ?? order.created_at)}</span>
        <span>•</span>
        <span>{order.work_type}</span>
        <span>•</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>
    </button>
  );
};

export default WorkOrderListRow;
