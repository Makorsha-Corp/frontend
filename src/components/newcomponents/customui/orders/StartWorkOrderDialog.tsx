import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface StartWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isStarting?: boolean;
  workOrderNumber: string;
  title?: string | null;
  hasMachineTarget: boolean;
}

function workOrderLabel(workOrderNumber: string, title?: string | null): string {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) return `${workOrderNumber} — ${trimmedTitle}`;
  return workOrderNumber;
}

const StartWorkOrderDialog: React.FC<StartWorkOrderDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isStarting = false,
  workOrderNumber,
  title,
  hasMachineTarget,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(28rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle>Start work order</DialogTitle>
          <DialogDescription>
            Confirm you want to start {workOrderLabel(workOrderNumber, title)}.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Pending inventory lines will be consumed from their source locations.</li>
          {hasMachineTarget ? (
            <li>The target machine will be set to Maintenance for this work.</li>
          ) : null}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isStarting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={isStarting}
            className="bg-brand-primary hover:bg-brand-primary-hover"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start work'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartWorkOrderDialog;
