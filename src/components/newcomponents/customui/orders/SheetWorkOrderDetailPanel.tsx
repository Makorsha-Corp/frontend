import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import WorkOrderDetailPanel from './WorkOrderDetailPanel';
import type { WorkOrder } from '@/types/workOrder';
import { cn } from '@/lib/utils';

export interface SheetWorkOrderDetailPanelProps {
  order: WorkOrder;
  onClose: () => void;
  onDelete?: () => void;
  className?: string;
}

const SheetWorkOrderDetailPanel: React.FC<SheetWorkOrderDetailPanelProps> = ({
  order,
  onClose,
  onDelete,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-0 w-[min(24rem,40%)] shrink-0 flex-col overflow-hidden border-l border-border bg-card',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">Entry detail</p>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkOrderDetailPanel
          variant="modal"
          order={order}
          onClose={onClose}
          onDelete={onDelete ?? onClose}
        />
      </div>
    </div>
  );
};

export default SheetWorkOrderDetailPanel;
