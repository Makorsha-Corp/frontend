import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Machine } from '@/types/machine';
import { Cog, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getMachineVisualKind,
  getMachineStatusLabel,
  machineListTopBarClass,
  machineBadgeClass,
  machineListCardSelectedClass,
} from '@/lib/machineVisualStatus';

export interface MachineListCardProps {
  machine: Machine;
  selected: boolean;
  /** Single-click on the card (not the expand control). */
  onSelect: () => void;
  /**
   * Optional expand control + double-click shortcut. When omitted, double-click re-selects same as single click.
   * When omitted, falls back to `onSelect`.
   */
  onExpandDetails?: () => void;
}

export const MachineListCard: React.FC<MachineListCardProps> = ({
  machine,
  selected,
  onSelect,
  onExpandDetails,
}) => {
  const kind = getMachineVisualKind(machine);
  const label = getMachineStatusLabel(machine);
  const expand = onExpandDetails ?? onSelect;
  const showExpandButton = onExpandDetails != null;

  return (
    <Card
      className={cn(
        'group flex cursor-pointer flex-col transition-all border-border',
        selected
          ? machineListCardSelectedClass
          : 'hover:border-brand-primary/25 hover:shadow-sm'
      )}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.preventDefault();
        expand();
      }}
    >
      <div className={cn('h-2 shrink-0 rounded-t-lg', machineListTopBarClass[kind])} aria-hidden />
      <CardHeader className="space-y-0 p-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 ring-1 ring-brand-primary/25 dark:bg-brand-primary/20"
              aria-hidden
            >
              <Cog className="h-4 w-4 text-brand-primary" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <CardTitle className="truncate text-base font-semibold leading-tight text-card-foreground">
                {machine.name}
              </CardTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium leading-tight', machineBadgeClass[kind])}>
                  {label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums leading-tight">#{machine.id}</span>
              </div>
              {[machine.model_number, machine.manufacturer].filter(Boolean).length > 0 ? (
                <p className="mt-1.5 truncate text-xs leading-tight text-muted-foreground">
                  {[machine.model_number, machine.manufacturer].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
          {showExpandButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-brand-primary"
              aria-label="Open full details"
              title="Full details"
              onClick={(e) => {
                e.stopPropagation();
                onExpandDetails!();
              }}
            >
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            </Button>
          ) : null}
        </div>
      </CardHeader>
    </Card>
  );
};

/** @deprecated Use `MachineListCard` — list responses include latest status fields. */
export const MachineListCardWithLatest = MachineListCard;

export default MachineListCard;
