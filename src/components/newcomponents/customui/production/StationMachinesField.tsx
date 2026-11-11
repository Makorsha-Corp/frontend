import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ProductionLineMachineBrief, ProductionLineMachineStatusSummary, ProductionLine } from '@/types/production';

export interface FactoryMachineOption {
  id: number;
  name: string;
  is_running: boolean;
  latest_status_type?: string | null;
}

export function lineMachineIds(line: ProductionLine): number[] {
  if (line.machine_ids?.length) return line.machine_ids;
  if (line.machine_id != null) return [line.machine_id];
  return [];
}

export function resolveLineMachineIdForSchedule(
  line: ProductionLine | undefined,
  logMachineId: number | null | undefined,
): number | null {
  if (logMachineId != null) return logMachineId;
  const ids = line ? lineMachineIds(line) : [];
  return ids.length === 1 ? ids[0] : null;
}

export function formatMachineStatusSummary(summary: ProductionLineMachineStatusSummary | undefined): string | null {
  if (!summary || summary.total === 0) return null;
  return `${summary.running} running · ${summary.idle} idle`;
}

interface StationMachinesFieldProps {
  machines: FactoryMachineOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export const StationMachinesField: React.FC<StationMachinesFieldProps> = ({
  machines,
  selectedIds,
  onChange,
  disabled,
  className,
}) => {
  const toggle = (id: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((row) => row !== id));
    }
  };

  if (machines.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No machines in this factory. Add machines under Machines first.
      </p>
    );
  }

  return (
    <div className={cn('max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2', className)}>
      {machines.map((machine) => {
        const checked = selectedIds.includes(machine.id);
        return (
          <label
            key={machine.id}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/40"
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(value) => toggle(machine.id, value === true)}
            />
            <span className="flex-1 truncate">{machine.name}</span>
            {machine.is_running != null && (
              <span
                className={cn(
                  'text-xs',
                  machine.is_running ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                )}
              >
                {machine.is_running ? 'Running' : 'Idle'}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
};

interface StationMachinesSummaryProps {
  machines?: ProductionLineMachineBrief[];
  summary?: ProductionLineMachineStatusSummary;
}

export const StationMachinesSummary: React.FC<StationMachinesSummaryProps> = ({ machines, summary }) => {
  if (!machines?.length) {
    return <p className="text-sm text-muted-foreground">No machines assigned to this station.</p>;
  }
  const statusLine = formatMachineStatusSummary(summary);
  return (
    <div className="space-y-1">
      <p className="text-sm text-foreground">{machines.map((m) => m.name).join(', ')}</p>
      {statusLine ? <p className="text-xs text-muted-foreground">{statusLine}</p> : null}
    </div>
  );
};
