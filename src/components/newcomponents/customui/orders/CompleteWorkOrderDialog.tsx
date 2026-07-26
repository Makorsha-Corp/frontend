import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WorkOrderCompleteRequest } from '@/types/workOrder';
import { format, parseISO, startOfDay } from 'date-fns';

const MACHINE_COMPLETE_STATUS_TOOLTIPS = {
  IDLE: 'Stop the machine when this order completes.',
  RUNNING: 'Keep the machine active when this order completes.',
} as const;

export interface CompleteWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: WorkOrderCompleteRequest) => Promise<void>;
  isCompleting?: boolean;
  /** Whether this order targets a machine — if so, the Idle/Running choice is required. */
  hasMachineTarget: boolean;
  mode?: 'standard' | 'as_planned';
  plannedDate?: string | null;
}

function formatPlannedDateLabel(plannedDate: string | null | undefined): string {
  const raw = plannedDate?.trim();
  if (!raw) return 'the planned date';
  try {
    return format(startOfDay(parseISO(raw.slice(0, 10))), 'MMM d, yyyy');
  } catch {
    return raw.slice(0, 10);
  }
}

const CompleteWorkOrderDialog: React.FC<CompleteWorkOrderDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  isCompleting = false,
  hasMachineTarget,
  mode = 'standard',
  plannedDate,
}) => {
  const [notes, setNotes] = useState('');
  const [machineStatus, setMachineStatus] = useState<'IDLE' | 'RUNNING' | ''>('');

  const canSubmit = !hasMachineTarget || Boolean(machineStatus);

  const resetForm = () => {
    setNotes('');
    setMachineStatus('');
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) resetForm();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onComplete({
      completion_notes: notes.trim() || undefined,
      machine_status: hasMachineTarget ? (machineStatus as 'IDLE' | 'RUNNING') : undefined,
    });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[min(28rem,94vw)] max-w-none"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'as_planned' ? 'Direct complete' : 'Mark work order complete'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'as_planned'
              ? `Record this work as done on ${formatPlannedDateLabel(plannedDate)}. Use when the job was already performed and this entry is catching up.`
              : 'Record completion notes and, if this order targets a machine, where to leave it.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="wo-complete-notes">Completion notes (optional)</Label>
            <Textarea
              id="wo-complete-notes"
              placeholder="What was done..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Recorded on the work order after you mark it complete.
            </p>
          </div>

          {hasMachineTarget && (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <Label className="shrink-0">
                Leave the machine in <span className="text-destructive">*</span>
              </Label>
              <TooltipProvider delayDuration={200}>
                <div className="flex shrink-0 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={machineStatus === 'IDLE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMachineStatus('IDLE')}
                      >
                        Idle
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[60] max-w-[240px] text-xs leading-snug">
                      {MACHINE_COMPLETE_STATUS_TOOLTIPS.IDLE}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={machineStatus === 'RUNNING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMachineStatus('RUNNING')}
                      >
                        Running
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[60] max-w-[240px] text-xs leading-snug">
                      {MACHINE_COMPLETE_STATUS_TOOLTIPS.RUNNING}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCompleting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCompleting || !canSubmit}
            className="bg-brand-primary hover:bg-brand-primary-hover"
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : mode === 'as_planned' ? (
              'Direct Complete'
            ) : (
              'Mark Complete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteWorkOrderDialog;
