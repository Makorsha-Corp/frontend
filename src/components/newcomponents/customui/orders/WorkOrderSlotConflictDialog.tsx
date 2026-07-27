import { AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { workOrderStatusLabel } from '@/pages/newpages/orders/workOrderConstants';
import type { WorkOrderSlotConflict } from '@/pages/newpages/orders/workOrderSlotConflict';

export interface WorkOrderSlotConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: WorkOrderSlotConflict | null;
  plannedDate: string;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function WorkOrderSlotConflictDialog({
  open,
  onOpenChange,
  conflict,
  plannedDate,
  onConfirm,
  isConfirming = false,
}: WorkOrderSlotConflictDialogProps) {
  if (!conflict) return null;

  const dateLabel = format(parseISO(plannedDate), 'MMM d, yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Work already planned
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{conflict.worksName}</span> is already
                planned for this machine on{' '}
                <span className="font-medium text-foreground">{dateLabel}</span>.
              </p>
              <p>
                Existing order:{' '}
                <span className="font-medium text-foreground">{conflict.workOrderNumber}</span> (
                {workOrderStatusLabel(conflict.status)}).
              </p>
              <p>Create a separate work order anyway?</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create separate order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
