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
import { machinePickWarningLabel, type MachinePickWarningReason } from '@/lib/productionMachinePickPolicy';

interface ProductionMachinePickWarningDialogProps {
  open: boolean;
  machineName: string | null;
  warnings: MachinePickWarningReason[];
  onCancel: () => void;
  onContinue: () => void;
}

export function ProductionMachinePickWarningDialog({
  open,
  machineName,
  warnings,
  onCancel,
  onContinue,
}: ProductionMachinePickWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Confirm machine
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {machineName ? (
                <p>
                  <span className="font-medium text-foreground">{machineName}</span> has conditions to review:
                </p>
              ) : (
                <p>This machine has conditions to review:</p>
              )}
              <ul className="list-disc pl-4">
                {warnings.map((reason) => (
                  <li key={reason}>{machinePickWarningLabel(reason)}</li>
                ))}
              </ul>
              <p>Continue anyway, or cancel and pick another machine.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue}>
            Continue anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
