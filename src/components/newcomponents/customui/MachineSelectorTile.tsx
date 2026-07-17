import React from 'react';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';
import {
  getMachineVisualKind,
  getMachineStatusLabel,
  machineListTopBarClass,
  machineSelectorTileClass,
  machineSelectorSubtextClass,
} from '@/lib/machineVisualStatus';

export const activeMachines = (list: Machine[] | undefined): Machine[] =>
  (list ?? []).filter((m) => m.is_active && !m.is_deleted);

export function filterAndSortMachines(list: Machine[], search: string): Machine[] {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.model_number && m.model_number.toLowerCase().includes(q)) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q)),
      )
    : list;
  return [...filtered].sort((a, b) => {
    if (a.is_running !== b.is_running) return a.is_running ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export interface MachineSelectorTileProps {
  machine: Machine;
  isHighlighted: boolean;
  onPick: () => void;
}

const MachineSelectorTile: React.FC<MachineSelectorTileProps> = ({
  machine: m,
  isHighlighted,
  onPick,
}) => {
  const kind = getMachineVisualKind(m);
  const label = getMachineStatusLabel(m);
  return (
    <button
      type="button"
      role="option"
      aria-selected={isHighlighted}
      onClick={onPick}
      className={cn(
        'flex min-h-[4.75rem] flex-col rounded-md border bg-card text-left shadow-sm outline-none transition-colors',
        'hover:border-brand-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        machineSelectorTileClass(kind, isHighlighted),
      )}
    >
      <div className={cn('h-2 shrink-0 rounded-t-md', machineListTopBarClass[kind])} aria-hidden />
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <span className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{m.name}</span>
        <span
          className={cn('text-[10px] font-semibold uppercase tracking-wide', machineSelectorSubtextClass[kind])}
        >
          {label}
        </span>
      </div>
    </button>
  );
};

export const MachineSelectorFooterStatus: React.FC<{ machine: Machine }> = ({ machine }) => {
  const kind = getMachineVisualKind(machine);
  const label = getMachineStatusLabel(machine);
  return (
    <>
      <span className="font-medium text-foreground">{machine.name}</span>
      <span className={cn('font-medium', machineSelectorSubtextClass[kind])}> · {label}</span>
    </>
  );
};

export default MachineSelectorTile;
