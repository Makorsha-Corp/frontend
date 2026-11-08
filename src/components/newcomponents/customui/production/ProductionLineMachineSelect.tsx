import React, { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { lineMachineIds } from '@/components/newcomponents/customui/production/StationMachinesField';
import type { ProductionLine, ProductionScheduleBatch } from '@/types/production';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import {
  buildMachineLiveWorkMap,
  buildMachineOccupancyForWindow,
  type MachineScheduleOccupancyMap,
} from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import { ProductionMachinePickWarningDialog } from '@/components/newcomponents/customui/production/ProductionMachinePickWarningDialog';
import {
  parseProductionMachinePickPolicy,
  type MachinePickWarningReason,
} from '@/lib/productionMachinePickPolicy';
import {
  plannedWindowIncludesNow,
  resolveMachinePickerTileDisplay,
} from '@/lib/machinePickerAvailability';
import { getMachineStatusLabel } from '@/lib/machineVisualStatus';
import { useGetMachineByIdQuery } from '@/features/machines/machinesApi';
import type { Machine } from '@/types/machine';

export function machinesForLine(line: ProductionLine | undefined): { id: number; name: string }[] {
  if (!line) return [];
  if (line.machines?.length) {
    return line.machines.map((m) => ({ id: m.id, name: m.name }));
  }
  const ids = lineMachineIds(line);
  return ids.map((id) => ({ id, name: `Machine #${id}` }));
}

export function soleMachineIdOnLine(line: ProductionLine | undefined): number | null {
  const list = machinesForLine(line);
  return list.length === 1 ? list[0].id : null;
}

export interface ProductionPlannedWindow {
  plannedStartAt: string;
  plannedEndAt: string;
}

interface ProductionLineMachineSelectProps {
  line: ProductionLine | undefined;
  value: number | null;
  onChange: (machineId: number | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  factoryId?: number;
  scheduleBatches?: ProductionScheduleBatch[];
  plannedWindow?: ProductionPlannedWindow | null;
  /** Non-embedded: helper under control. Embedded: info tooltip beside Machine label. */
  description?: string;
  /** Taller summary button (start-step dialog); default matches h-9 row controls elsewhere. */
  summarySize?: 'compact' | 'comfortable';
  /** Inside start-step summary card: match dt/dd labels, no helper under control. */
  embedded?: boolean;
  /** Stage log being assigned (exempt from live-step pick conflict). */
  excludeStageLogId?: number;
  /** Open batch. Its own planned window is not a booking. */
  excludeBatchId?: number;
}

/** Matches Line select / Minutes input (h-9) in batch step rows */
const MACHINE_ROW_CONTROL_HEIGHT = 'h-9 min-h-9 max-h-9 py-1.5 leading-none';

function MachineFieldLabel({
  htmlFor,
  className,
  hint,
}: {
  htmlFor?: string;
  className: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor} className={className}>
        Machine
      </Label>
      {hint ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="About machine selection"
              >
                <Info className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[14rem] text-xs leading-snug">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );
}

const ProductionLineMachineSelect: React.FC<ProductionLineMachineSelectProps> = ({
  line,
  value,
  onChange,
  disabled,
  className,
  id = 'production-line-machine',
  factoryId: factoryIdProp,
  scheduleBatches = [],
  plannedWindow,
  description,
  summarySize = 'compact',
  embedded = false,
  excludeStageLogId,
  excludeBatchId,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickWarningOpen, setPickWarningOpen] = useState(false);
  const [pendingPick, setPendingPick] = useState<{
    machine: Machine;
    warnings: MachinePickWarningReason[];
  } | null>(null);
  const workspaceSettings = useAppSelector((state) => state.auth.workspace?.settings);
  const pickPolicy = parseProductionMachinePickPolicy(workspaceSettings);
  const options = useMemo(() => machinesForLine(line), [line]);
  const allowedMachineIds = useMemo(() => options.map((m) => m.id), [options]);
  const factoryId = factoryIdProp ?? line?.factory_id;

  const occupancyByMachineId: MachineScheduleOccupancyMap | undefined = useMemo(
    () =>
      buildMachineOccupancyForWindow(allowedMachineIds, plannedWindow, scheduleBatches, {
        batchId: excludeBatchId,
        stageLogId: excludeStageLogId,
      }),
    [allowedMachineIds, plannedWindow, scheduleBatches, excludeBatchId, excludeStageLogId],
  );

  const liveWorkByMachineId = useMemo(
    () => buildMachineLiveWorkMap(scheduleBatches, allowedMachineIds),
    [scheduleBatches, allowedMachineIds],
  );

  const selectedName = value != null ? options.find((m) => m.id === value)?.name : undefined;
  const { data: selectedMachine } = useGetMachineByIdQuery(value ?? 0, { skip: value == null });

  const hasPlannedWindow = occupancyByMachineId != null;
  const windowIncludesNow = hasPlannedWindow
    ? plannedWindowIncludesNow(plannedWindow ?? null)
    : false;

  const selectedSummary = useMemo(() => {
    if (value == null || !selectedMachine) return null;
    if (hasPlannedWindow) {
      const occupancy = value != null ? occupancyByMachineId?.[value] : undefined;
      const liveWork = value != null ? liveWorkByMachineId[value] : undefined;
      const display = resolveMachinePickerTileDisplay(
        selectedMachine,
        occupancy,
        true,
        windowIncludesNow,
        liveWork,
      );
      if (display) {
        return {
          detail: display.subtext,
          detailClass: display.subtextClass,
          detailTitle: display.subtextTitle,
          stripClass: display.topBarClass,
        };
      }
    }
    return {
      detail: getMachineStatusLabel(selectedMachine),
      detailClass: 'text-muted-foreground',
      stripClass: undefined,
    };
  }, [
    selectedMachine,
    hasPlannedWindow,
    occupancyByMachineId,
    value,
    windowIncludesNow,
    liveWorkByMachineId,
  ]);

  const summaryStripClass =
    value == null && hasPlannedWindow
      ? 'bg-amber-500'
      : selectedSummary?.stripClass;

  useEffect(() => {
    if (disabled || !line) return;
    if (value != null && !options.some((m) => m.id === value)) {
      onChange(soleMachineIdOnLine(line));
      return;
    }
    if (value == null && options.length === 1) {
      onChange(options[0].id);
    }
  }, [line, options, value, onChange, disabled]);

  const fieldLabelClass = embedded
    ? 'text-xs font-medium text-muted-foreground'
    : 'text-xs text-muted-foreground';
  const showDescription = !embedded && Boolean(description?.trim());
  const labelHint = embedded && description?.trim() ? description.trim() : undefined;

  if (!line) {
    return (
      <div className={cn('grid gap-1', className)}>
        <Label className={fieldLabelClass}>Machine</Label>
        <p className={cn('flex items-center text-sm text-muted-foreground', MACHINE_ROW_CONTROL_HEIGHT)}>
          Select a line first
        </p>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={cn('grid gap-1', className)}>
        <Label className={fieldLabelClass}>Machine</Label>
        <div
          className={cn(
            'flex items-center rounded-md border border-dashed border-border/80 bg-muted/20 px-2.5 text-xs text-muted-foreground',
            MACHINE_ROW_CONTROL_HEIGHT,
          )}
          title="Link machines to this production line in Setup"
        >
          No machines on this line
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid min-w-0 gap-1', embedded && 'gap-1.5', className)}>
      <MachineFieldLabel htmlFor={id} className={fieldLabelClass} hint={labelHint} />
      <MachineSelectSummaryButton
        id={id}
        className={cn(
          'mt-0',
          summarySize === 'comfortable'
            ? 'min-h-[2.75rem] h-auto max-h-none py-2'
            : MACHINE_ROW_CONTROL_HEIGHT,
        )}
        summaryDetailInline={summarySize !== 'comfortable'}
        disabled={disabled}
        onClick={() => setDialogOpen(true)}
        ariaLabel={
          selectedName && selectedSummary?.detail
            ? `Change machine. Current: ${selectedName}, ${selectedSummary.detail}`
            : selectedName
              ? `Change machine. Current: ${selectedName}`
              : 'Select machine'
        }
        selectedLine={selectedName ?? null}
        staleNumericId={value != null && !selectedName ? String(value) : null}
        summaryDetail={selectedSummary?.detail ?? null}
        summaryDetailClassName={selectedSummary?.detailClass}
        summaryDetailTitle={selectedSummary?.detailTitle}
        leadingStripClassName={summaryStripClass}
        compactLabel
        emptyLabel="Not set"
      />
      <MachineSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialFactoryId={factoryId}
        allowedMachineIds={allowedMachineIds}
        occupancyByMachineId={occupancyByMachineId}
        liveWorkByMachineId={liveWorkByMachineId}
        plannedWindow={plannedWindow}
        title="Pick a machine"
        titleDetail={line.name}
        applyProductionPickPolicy
        productionMachinePickPolicy={pickPolicy}
        onClearSelection={() => onChange(null)}
        onSelect={(machine) => onChange(machine.id)}
        onRequestPickConfirmation={(machine, warnings) => {
          setPendingPick({ machine, warnings });
          setPickWarningOpen(true);
        }}
        excludeStageLogId={excludeStageLogId}
      />
      <ProductionMachinePickWarningDialog
        open={pickWarningOpen}
        machineName={pendingPick?.machine.name ?? null}
        warnings={pendingPick?.warnings ?? []}
        onCancel={() => {
          setPickWarningOpen(false);
          setPendingPick(null);
        }}
        onContinue={() => {
          if (pendingPick) onChange(pendingPick.machine.id);
          setPickWarningOpen(false);
          setPendingPick(null);
          setDialogOpen(false);
        }}
      />
      {showDescription ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
};

export default ProductionLineMachineSelect;
