import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  ProductionBatchStageLog,
  ProductionLine,
  ProductionScheduleBatch,
} from '@/types/production';
import BlockedActionButton, {
  type BlockedActionHint,
} from '@/components/newcomponents/customui/BlockedActionButton';
import { Play } from 'lucide-react';
import ProductionLineMachineSelect, {
  machinesForLine,
  type ProductionPlannedWindow,
} from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import { ProductionLineSelectOptions } from '@/components/newcomponents/customui/production/ProductionLineSelectOptions';
import { productionLineHasMachines } from '@/lib/productionLineMachines';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useFormatDateTimeFromApi } from '@/hooks/useFormatDateFromApi';
import { cn } from '@/lib/utils';
import { BATCH_STAGE_LOG_STATUS_BADGE } from '../productionPageUtils';

export interface BatchRunSelectedStepPanelProps {
  log: ProductionBatchStageLog | null;
  lines: ProductionLine[];
  multiStepRun: boolean;
  canEditStepMeta: boolean;
  canLogStages: boolean;
  factoryId?: number;
  scheduleBatches?: ProductionScheduleBatch[];
  plannedWindow?: ProductionPlannedWindow | null;
  onSaveLine: (log: ProductionBatchStageLog, lineId: number | null) => void;
  onSaveMinutes: (log: ProductionBatchStageLog, minutes: number | null) => void;
  onSaveMachine: (log: ProductionBatchStageLog, machineId: number | null) => void;
  onStart: (log: ProductionBatchStageLog) => void;
  onFinish: (log: ProductionBatchStageLog) => void | Promise<void>;
  /** False when an earlier step is still open. */
  canStartStep?: boolean;
  finishBlocked?: boolean;
  finishBlockedHint?: BlockedActionHint;
  onFinishBlocked?: () => void;
  finishBusy?: boolean;
  onSaveConditions?: () => void | Promise<void>;
  saveConditionsBusy?: boolean;
  nextStepOffer?: { afterLogId: number; nextLogId: number; stageName: string } | null;
  onGoToNextStep?: () => void;
  children?: React.ReactNode;
}

const BatchRunSelectedStepPanel: React.FC<BatchRunSelectedStepPanelProps> = ({
  log,
  lines,
  multiStepRun,
  canEditStepMeta,
  canLogStages,
  factoryId,
  scheduleBatches,
  plannedWindow,
  onSaveLine,
  onSaveMinutes,
  onSaveMachine,
  onStart,
  onFinish,
  canStartStep = true,
  finishBlocked = false,
  finishBlockedHint,
  onFinishBlocked,
  finishBusy = false,
  onSaveConditions,
  saveConditionsBusy = false,
  nextStepOffer = null,
  onGoToNextStep,
  children,
}) => {
  const formatDateTime = useFormatDateTimeFromApi();
  const [minutesDraft, setMinutesDraft] = useState('');

  const stepLine = useMemo(
    () => (log?.production_line_id != null ? lines.find((l) => l.id === log.production_line_id) : undefined),
    [log, lines],
  );

  const stepMachineLabel = useMemo(() => {
    if (!log || log.machine_id == null) return '—';
    const options = machinesForLine(stepLine);
    return options.find((m) => m.id === log.machine_id)?.name ?? `Machine #${log.machine_id}`;
  }, [log, stepLine]);

  useEffect(() => {
    if (!log) {
      setMinutesDraft('');
      return;
    }
    setMinutesDraft(
      log.expected_duration_minutes != null ? String(log.expected_duration_minutes) : '',
    );
  }, [log]);

  if (!log) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        Select a step from the path.
      </p>
    );
  }

  const lineSelectValue = log.production_line_id != null ? String(log.production_line_id) : undefined;
  const startedLabel = log.started_at ? `Started ${formatDateTime(log.started_at)}` : null;
  const finishedLabel = log.completed_at
    ? `${log.status === 'skipped' ? 'Skipped' : 'Completed'} ${formatDateTime(log.completed_at)}`
    : null;
  const timeLine = [startedLabel, finishedLabel].filter(Boolean).join(' · ');

  return (
    <div className="min-h-0 space-y-4 px-4 py-4 md:px-5 md:py-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight md:text-xl">{log.stage_name}</h2>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 border-transparent capitalize hover:bg-transparent',
                BATCH_STAGE_LOG_STATUS_BADGE[log.status],
              )}
            >
              {log.status.replace('_', ' ')}
            </Badge>
          </div>
          {timeLine ? (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{timeLine}</p>
          ) : null}
        </div>

        {canLogStages && (log.status === 'pending' || log.status === 'in_progress') ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {log.status === 'pending' ? (
              <Button
                type="button"
                variant="default"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={!canStartStep}
                title={
                  canStartStep
                    ? undefined
                    : 'Finish earlier steps before starting this one'
                }
                onClick={() => onStart(log)}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Start
              </Button>
            ) : null}
            {log.status === 'in_progress' && onSaveConditions ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                className="h-10 px-4"
                disabled={saveConditionsBusy || finishBusy}
                onClick={() => void onSaveConditions()}
              >
                Save
              </Button>
            ) : null}
            {log.status === 'in_progress' ? (
              <BlockedActionButton
                variant="default"
                size="default"
                className="h-10 bg-brand-primary px-4 hover:bg-brand-primary-hover"
                blocked={finishBlocked}
                blockedHint={finishBlockedHint}
                blockedClassName="opacity-100 ring-2 ring-amber-500/50"
                isBusy={finishBusy}
                onAction={() => void onFinish(log)}
                onBlockedClick={onFinishBlocked}
              >
                Finish
              </BlockedActionButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {nextStepOffer && nextStepOffer.afterLogId === log.id && log.status === 'completed' ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <p className="text-sm text-muted-foreground">This step is done.</p>
          <Button type="button" size="sm" variant="secondary" onClick={onGoToNextStep}>
            Next: {nextStepOffer.stageName}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1.2fr)_6.25rem_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-1">
          <Label className="text-xs text-muted-foreground">Line</Label>
          {canEditStepMeta ? (
            <TooltipProvider delayDuration={200}>
              <Select
                value={lineSelectValue}
                onValueChange={(value) => {
                  const line = lines.find((row) => row.id === Number(value));
                  if (
                    line &&
                    !productionLineHasMachines(line) &&
                    log.production_line_id !== line.id
                  ) {
                    return;
                  }
                  onSaveLine(log, Number(value));
                }}
                disabled={lineSelectValue == null && lines.length === 0}
              >
                <SelectTrigger className="h-9 min-w-0 w-full">
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  <ProductionLineSelectOptions
                    lines={lines}
                    selectedLineId={lineSelectValue ?? null}
                    showIndicator={false}
                  />
                </SelectContent>
              </Select>
            </TooltipProvider>
          ) : (
            <p className="flex h-9 items-center truncate text-sm font-medium">{stepLine?.name ?? '—'}</p>
          )}
        </div>
        <div className="grid min-w-0 gap-1">
          <Label className="text-xs text-muted-foreground">Minutes</Label>
          {canEditStepMeta ? (
            <Input
              className="h-9 w-full tabular-nums"
              inputMode="numeric"
              value={minutesDraft}
              onChange={(e) => setMinutesDraft(e.target.value)}
              onBlur={() => {
                const trimmed = minutesDraft.trim();
                const next = trimmed === '' ? null : parseInt(trimmed, 10);
                if (trimmed !== '' && (next == null || Number.isNaN(next) || next < 0)) return;
                const current = log.expected_duration_minutes ?? null;
                if (next === current) return;
                onSaveMinutes(log, next);
              }}
            />
          ) : (
            <p className="flex h-9 items-center text-sm tabular-nums">{log.expected_duration_minutes ?? '—'}</p>
          )}
        </div>
        {multiStepRun ? (
          <div className="grid min-w-0 gap-1">
            {canEditStepMeta ? (
              <ProductionLineMachineSelect
                line={stepLine}
                value={log.machine_id ?? null}
                factoryId={factoryId}
                scheduleBatches={scheduleBatches}
                plannedWindow={plannedWindow}
                id={`batch-step-machine-${log.id}`}
                excludeStageLogId={log.id}
                excludeBatchId={log.batch_id}
                onChange={(id) => onSaveMachine(log, id)}
              />
            ) : (
              <>
                <Label className="text-xs text-muted-foreground">Machine</Label>
                <p className="flex h-9 items-center truncate text-sm font-medium">{stepMachineLabel}</p>
              </>
            )}
          </div>
        ) : null}
      </div>

      {(stepLine != null && !stepLine.is_active) ||
      (log.production_line_id != null &&
        lines.length > 0 &&
        !lines.some((line) => line.id === log.production_line_id)) ? (
        <p className="text-sm text-muted-foreground">Inputs from storage.</p>
      ) : null}

      {children ? <div>{children}</div> : null}
    </div>
  );
};

export default BatchRunSelectedStepPanel;
