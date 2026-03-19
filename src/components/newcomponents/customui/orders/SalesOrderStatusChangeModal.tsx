import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SalesOrder } from '@/types/salesOrder';
import type { SalesOrderKanbanColumn } from './salesOrderStatusConstants';
import { getStatusIdsForColumn } from './salesOrderStatusConstants';
import { Loader2 } from 'lucide-react';

interface SalesOrderStatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SalesOrder | null;
  targetColumn: SalesOrderKanbanColumn | null;
  statuses: { id: number; name: string }[];
  onConfirm: (orderId: number, newStatusId: number) => Promise<void>;
}

const SalesOrderStatusChangeModal: React.FC<SalesOrderStatusChangeModalProps> = ({
  open,
  onOpenChange,
  order,
  targetColumn,
  statuses,
  onConfirm,
}) => {
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetStatusIds = targetColumn ? getStatusIdsForColumn(targetColumn, statuses) : [];
  const defaultStatusId = targetStatusIds[0] ?? null;

  const effectiveStatusId = selectedStatusId ?? defaultStatusId;

  const handleConfirm = async () => {
    if (!order || effectiveStatusId == null) return;
    setIsSubmitting(true);
    try {
      await onConfirm(order.id, effectiveStatusId);
      onOpenChange(false);
      setSelectedStatusId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedStatusId(null);
    onOpenChange(next);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {order.sales_order_number}</DialogTitle>
          <DialogDescription>
            Choose the status for this order. You can change it to match the column or pick a different status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New status</label>
            <Select
              value={effectiveStatusId?.toString() ?? ''}
              onValueChange={(v) => setSelectedStatusId(Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleConfirm}
            disabled={isSubmitting || effectiveStatusId == null}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesOrderStatusChangeModal;
