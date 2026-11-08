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
import type { MachineLiveWork } from '@/components/newcomponents/customui/production/productionMachineOccupancy';

interface ProductionStartLiveMachineDialogProps {
  open: boolean;
  machineName: string | null;
  liveWork: MachineLiveWork | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ProductionStartLiveMachineDialog({
  open,
  machineName,
  liveWork,
  onCancel,
  onConfirm,
}: ProductionStartLiveMachineDialogProps) {
  const batch = liveWork?.batchNumber?.trim();
  const stage = liveWork?.stageName?.trim();
  const runningLabel = batch
    ? stage
      ? `${batch} · ${stage}`
      : batch
    : 'another batch';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Machine in use
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {machineName ? (
                <p>
                  <span className="font-medium text-foreground">{machineName}</span> is running{' '}
                  <span className="font-medium text-foreground">{runningLabel}</span>.
                </p>
              ) : (
                <p>This machine is running {runningLabel}.</p>
              )}
              <p>Start this step on this machine anyway?</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
