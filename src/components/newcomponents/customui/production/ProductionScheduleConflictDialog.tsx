import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProductionScheduleConflict } from './productionScheduleConflict';

interface ProductionScheduleConflictDialogProps {
  open: boolean;
  conflicts: ProductionScheduleConflict[];
  onCancel: () => void;
  onSaveAnyway: () => void;
}

export function ProductionScheduleConflictDialog({
  open,
  conflicts,
  onCancel,
  onSaveAnyway,
}: ProductionScheduleConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Overlapping plan
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              <p>This window overlaps another open batch on the same line or machine.</p>
              <ul className="list-disc pl-4">
                {conflicts.map((conflict) => (
                  <li key={`${conflict.batchId}-${conflict.reason}`}>
                    <span className="font-medium text-foreground">{conflict.batchNumber}</span> shares a {conflict.reason}
                  </li>
                ))}
              </ul>
              <p>Save anyway, or cancel and pick another start.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSaveAnyway}>
            Save anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
