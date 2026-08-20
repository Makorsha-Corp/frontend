import React, { useMemo, useState } from 'react';
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
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WorkOrderCompleteRequest } from '@/types/workOrder';
import { format, parseISO, startOfDay } from 'date-fns';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { API_LIMITS } from '@/constants/apiLimits';
import { activeEventButtonClass } from '@/lib/machineVisualStatus';
import { MACHINE_EVENT_STATUS_TOOLTIPS } from '@/lib/machineStatusTooltips';
import { cn } from '@/lib/utils';
import { formatOtherActiveJobsWarning } from './workOrderCompleteCopy';

export interface CompleteWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: WorkOrderCompleteRequest) => Promise<void>;
  isCompleting?: boolean;
  workOrderId: number;
  machineId?: number | null;
  /** Whether this order targets a machine — if so, the Idle/Off choice is required. */
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
  workOrderId,
  machineId,
  hasMachineTarget,
  mode = 'standard',
  plannedDate,
}) => {
  const [notes, setNotes] = useState('');
  const [machineStatus, setMachineStatus] = useState<'IDLE' | 'OFF' | ''>('');

  const shouldFetchSiblings = open && machineId != null;
  const { data: inProgressOnMachine = [] } = useGetWorkOrdersQuery(
    {
      machine_id: machineId ?? undefined,
      status: 'IN_PROGRESS',
      limit: API_LIMITS.FLEXIBLE_1000,
    },
    { skip: !shouldFetchSiblings },
  );

  const otherActiveJobs = useMemo(
    () => inProgressOnMachine.filter((wo) => wo.id !== workOrderId),
    [inProgressOnMachine, workOrderId],
  );

  const siblingWarning =
    otherActiveJobs.length > 0
      ? formatOtherActiveJobsWarning(otherActiveJobs.map((wo) => wo.work_order_number))
      : null;

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
      machine_status: hasMachineTarget ? (machineStatus as 'IDLE' | 'OFF') : undefined,
    });
    resetForm();
  };

  const statusButtonClass = (status: 'IDLE' | 'OFF', selected: boolean) =>
    cn(
      'border',
      selected ? activeEventButtonClass(status) : 'border-border bg-background hover:bg-muted/50',
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(28rem,94vw)] max-w-none">
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
          {siblingWarning ? (
            <div
              role="alert"
              className="flex gap-2.5 rounded-md border border-amber-600/30 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium leading-snug">{siblingWarning.title}</p>
                <p className="text-xs leading-snug text-amber-900/90 dark:text-amber-100/90">
                  {siblingWarning.body}
                </p>
              </div>
            </div>
          ) : null}

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
                        variant="outline"
                        size="sm"
                        className={statusButtonClass('IDLE', machineStatus === 'IDLE')}
                        onClick={() => setMachineStatus('IDLE')}
                      >
                        Idle
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[60] max-w-[240px] text-xs leading-snug">
                      {MACHINE_EVENT_STATUS_TOOLTIPS.IDLE}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={statusButtonClass('OFF', machineStatus === 'OFF')}
                        onClick={() => setMachineStatus('OFF')}
                      >
                        Off
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[60] max-w-[240px] text-xs leading-snug">
                      {MACHINE_EVENT_STATUS_TOOLTIPS.OFF}
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
