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
import type { WorkOrderCompleteRequest } from '@/types/workOrder';

export interface CompleteWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: WorkOrderCompleteRequest) => Promise<void>;
  isCompleting?: boolean;
  /** Whether this order targets a machine — if so, the Idle/Running choice is required. */
  hasMachineTarget: boolean;
}

const CompleteWorkOrderDialog: React.FC<CompleteWorkOrderDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  isCompleting = false,
  hasMachineTarget,
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
      <DialogContent className="w-[min(28rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle>Mark work order complete</DialogTitle>
          <DialogDescription>
            Record completion notes and, if this order targets a machine, where to leave it.
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
            <div className="space-y-2">
              <Label>
                Leave the machine in <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={machineStatus === 'IDLE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMachineStatus('IDLE')}
                >
                  Idle
                </Button>
                <Button
                  type="button"
                  variant={machineStatus === 'RUNNING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMachineStatus('RUNNING')}
                >
                  Running
                </Button>
              </div>
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
