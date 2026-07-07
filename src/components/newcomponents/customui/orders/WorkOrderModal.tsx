import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useGetWorkOrderByIdQuery, useDeleteWorkOrderMutation } from '@/features/workOrders/workOrdersApi';
import WorkOrderDetailPanel from './WorkOrderDetailPanel';
import toast from 'react-hot-toast';
import type { WorkOrderItemSourceType } from '@/types/workOrder';

export interface WorkOrderModalProps {
  workOrderId: number | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  /** If set, the panel auto-opens its item editor with this source type preselected —
   * used right after a quick action creates an order that involves parts. */
  autoOpenItemsSourceHint?: WorkOrderItemSourceType | null;
}

/** The "big modal" — the full work order detail experience (approvals, start/complete/void,
 * items, event log) reused as a Dialog instead of a page, so it can be opened from anywhere
 * (machine quick actions, machine work order history, etc). */
const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  workOrderId,
  onOpenChange,
  onDeleted,
  autoOpenItemsSourceHint,
}) => {
  const { data: order } = useGetWorkOrderByIdQuery(workOrderId!, { skip: workOrderId == null });
  const [deleteOrder] = useDeleteWorkOrderMutation();

  const handleDelete = async () => {
    if (!order) return;
    if (!window.confirm(`Delete work order ${order.work_order_number}?`)) return;
    try {
      await deleteOrder(order.id).unwrap();
      toast.success('Work order deleted');
      onDeleted?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete work order');
    }
  };

  return (
    <Dialog open={workOrderId != null} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] w-[min(72rem,95vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogTitle className="sr-only">{order ? `Work order ${order.work_order_number}` : 'Work order'}</DialogTitle>
        {order ? (
          <WorkOrderDetailPanel
            order={order}
            onClose={() => onOpenChange(false)}
            onDelete={handleDelete}
            variant="modal"
            autoOpenItemsSourceHint={autoOpenItemsSourceHint}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderModal;
