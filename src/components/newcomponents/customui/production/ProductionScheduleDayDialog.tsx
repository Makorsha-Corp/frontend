import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { machinesForLine } from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import { scheduleStepStatusLabel, scheduleStepsForDay } from '@/components/newcomponents/customui/production/scheduleWeekBoard';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import type { ProductionLine, ProductionScheduleBatch, ProductionScheduleStep } from '@/types/production';

interface ProductionScheduleDayDialogProps {
  day: Date | null;
  batches: ProductionScheduleBatch[];
  lines: ProductionLine[];
  onOpenChange: (open: boolean) => void;
  onOpenBatch: (batchId: number) => void;
  onAddBatch: (day: Date) => void;
}

function wallClock(iso: string, use24Hour: boolean): string {
  const when = new Date(iso);
  const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
  return formatWallTimeHm(hm, use24Hour);
}

function machineNameOnStep(step: ProductionScheduleStep, lines: ProductionLine[]): string | null {
  if (step.machine_id == null) return null;
  const line = lines.find((row) => row.id === step.production_line_id);
  const match = machinesForLine(line).find((machine) => machine.id === step.machine_id);
  if (!match) return null;
  if (match.name === `Machine #${match.id}`) return null;
  return match.name;
}

export function ProductionScheduleDayDialog({
  day,
  batches,
  lines,
  onOpenChange,
  onOpenBatch,
  onAddBatch,
}: ProductionScheduleDayDialogProps) {
  const { use24Hour } = useUserTimeFormat();
  const rows = day ? scheduleStepsForDay(batches, day) : [];
  const title = day ? format(day, 'EEE dd.MM.yyyy') : '';

  return (
    <Dialog open={day != null} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Steps planned on this day.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No planned steps this day.</p>
          ) : (
            <ul className="space-y-1">
              {rows.map(({ batch, step }) => {
                const line = lines.find((row) => row.id === step.production_line_id);
                const lineLabel = line?.name ?? 'Unassigned';
                const showStepName = line ? step.stage_name !== line.name : Boolean(step.stage_name);
                const machineName = machineNameOnStep(step, lines);
                const status = scheduleStepStatusLabel(batch.status, step.status);
                return (
                  <li key={step.stage_log_id}>
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                      onClick={() => {
                        onOpenBatch(batch.batch_id);
                        onOpenChange(false);
                      }}
                    >
                      <span className="text-muted-foreground">
                        {wallClock(step.planned_start_at, use24Hour)}–{wallClock(step.planned_end_at, use24Hour)}
                      </span>
                      <span>{lineLabel}</span>
                      <span className="font-medium">{batch.batch_number}</span>
                      {showStepName ? <span className="text-muted-foreground">{step.stage_name}</span> : null}
                      {machineName ? <span className="text-muted-foreground">{machineName}</span> : null}
                      {status ? <span className="text-muted-foreground">{status}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            onClick={() => {
              if (!day) return;
              onAddBatch(day);
              onOpenChange(false);
            }}
          >
            Add batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
