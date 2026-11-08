import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductionLineSelectOptions } from '@/components/newcomponents/customui/production/ProductionLineSelectOptions';
import { productionLineHasMachines } from '@/lib/productionLineMachines';
import type { ProductionLine } from '@/types/production';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';

const ANY_MACHINE = 'any';

export interface RouteStepAddPayload {
  production_line_id: number;
  machine_id: number | null;
}

export interface RouteStepPickerProps {
  lines: ProductionLine[];
  onAdd?: (payload: RouteStepAddPayload) => void | Promise<void>;
  onUpdate?: (payload: RouteStepAddPayload) => void | Promise<void>;
  disabled?: boolean;
  isAdding?: boolean;
  isSaving?: boolean;
  mode?: 'add' | 'edit';
  initialLineId?: number;
  initialMachineId?: number | null;
  embedded?: boolean;
  onAdded?: () => void;
  onSaved?: () => void;
  className?: string;
}

export const RouteStepPicker: React.FC<RouteStepPickerProps> = ({
  lines,
  onAdd,
  onUpdate,
  disabled,
  isAdding,
  isSaving,
  mode = 'add',
  initialLineId,
  initialMachineId = null,
  embedded = false,
  onAdded,
  onSaved,
  className,
}) => {
  const isEdit = mode === 'edit';
  const [stationId, setStationId] = useState('');
  const [machinePick, setMachinePick] = useState(ANY_MACHINE);

  useEffect(() => {
    if (!isEdit || initialLineId == null) return;
    setStationId(String(initialLineId));
    setMachinePick(initialMachineId != null ? String(initialMachineId) : ANY_MACHINE);
  }, [isEdit, initialLineId, initialMachineId]);

  const selectedLine = useMemo(
    () => lines.find((line) => line.id === Number(stationId)),
    [lines, stationId],
  );

  useEffect(() => {
    setMachinePick(ANY_MACHINE);
  }, [stationId]);

  const handleSubmit = async () => {
    const lineId = parseInt(stationId, 10);
    if (!lineId) return;
    const machine_id =
      machinePick === ANY_MACHINE || !machinePick ? null : parseInt(machinePick, 10);
    const payload = {
      production_line_id: lineId,
      machine_id: Number.isFinite(machine_id as number) ? machine_id : null,
    };
    try {
      if (isEdit) {
        await onUpdate?.(payload);
        onSaved?.();
      } else {
        await onAdd?.(payload);
        setStationId('');
        setMachinePick(ANY_MACHINE);
        onAdded?.();
      }
    } catch {
      /* parent toasts */
    }
  };

  const busy = isAdding || isSaving;
  const canSubmit =
    Boolean(stationId) &&
    selectedLine != null &&
    productionLineHasMachines(selectedLine) &&
    !disabled &&
    !busy;

  const form = (
    <>
      <div className="grid gap-1.5">
        <Label>1. Production line</Label>
        <Select
          value={stationId || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              setStationId('');
              return;
            }
            const line = lines.find((row) => row.id === Number(value));
            if (line && !productionLineHasMachines(line)) return;
            setStationId(value);
          }}
          disabled={disabled || lines.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pick production line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              Pick production line
            </SelectItem>
            <ProductionLineSelectOptions lines={lines} selectedLineId={stationId || null} />
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>2. Machine (optional)</Label>
        <Select
          value={machinePick}
          onValueChange={setMachinePick}
          disabled={!stationId || disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any machine on production line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_MACHINE}>Any machine on this production line</SelectItem>
            {(selectedLine?.machines ?? []).map((machine) => (
              <SelectItem key={machine.id} value={String(machine.id)}>
                {machine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" size="sm" className="w-full" onClick={() => void handleSubmit()} disabled={!canSubmit}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? 'Save step' : 'Add step'}
      </Button>
    </>
  );

  if (embedded) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn('space-y-3', className)}>{form}</div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('space-y-3 rounded-md border border-border bg-background p-3', className)}>
        {form}
      </div>
    </TooltipProvider>
  );
};

export default RouteStepPicker;
