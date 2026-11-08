import React from 'react';
import { Check } from 'lucide-react';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';
import {
  getMachineVisualKind,
  getMachineStatusLabel,
  machineListTopBarClass,
  machineSelectorTileClass,
  machineSelectorSubtextClass,
} from '@/lib/machineVisualStatus';
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';
import { resolveMachinePickerTileDisplay } from '@/lib/machinePickerAvailability';
import {
  formatBusyNowTooltip,
  type MachineLiveWork,
  type MachineScheduleOccupancy,
} from '@/components/newcomponents/customui/production/productionMachineOccupancy';

function BusyNowStatusLine({
  subtext,
  subtextClass,
  liveWork,
}: {
  subtext: string;
  subtextClass: string;
  liveWork?: MachineLiveWork | null;
}) {
  const detail = formatBusyNowTooltip(liveWork ?? undefined);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'truncate text-[10px] font-semibold uppercase tracking-wide',
            subtextClass,
          )}
        >
          {subtext}
        </span>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[200] w-auto max-w-[min(18rem,calc(100vw-2rem))] p-3"
        >
          <p className="text-xs leading-snug text-foreground">{detail}</p>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}

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
  /** Multi-select mode: tile is in the current selection set. */
  isSelected?: boolean;
  onPick: () => void;
  scheduleOccupancy?: MachineScheduleOccupancy;
  /** Batch step picker: planned window context for availability labels. */
  batchPickerContext?: {
    hasPlannedWindow: boolean;
    windowIncludesNow: boolean;
    liveWork?: MachineLiveWork | null;
  };
  pickBlocked?: boolean;
  pickBlockedReason?: string;
}

const MachineSelectorTile: React.FC<MachineSelectorTileProps> = ({
  machine: m,
  isHighlighted,
  isSelected = false,
  onPick,
  scheduleOccupancy,
  batchPickerContext,
  pickBlocked = false,
  pickBlockedReason,
}) => {
  const kind = getMachineVisualKind(m);
  const pickerDisplay =
    batchPickerContext != null
      ? resolveMachinePickerTileDisplay(
          m,
          scheduleOccupancy,
          batchPickerContext.hasPlannedWindow,
          batchPickerContext.windowIncludesNow,
          batchPickerContext.liveWork,
        )
      : null;
  const subtext = pickerDisplay?.subtext ?? getMachineStatusLabel(m);
  const subtextClass = pickerDisplay?.subtextClass ?? machineSelectorSubtextClass[kind];
  const topBarClass = pickerDisplay?.topBarClass ?? machineListTopBarClass[kind];
  const tileBorderClass = pickerDisplay
    ? pickerDisplay.borderRingClass
    : machineSelectorTileClass(kind, false);
  const emphasized = isHighlighted || isSelected;
  const liveWork = batchPickerContext?.liveWork;
  const showBusyNowHover =
    pickerDisplay?.bucket === 'available_busy_now' && !pickBlocked;
  const hoverHint = pickBlocked ? pickBlockedReason : pickerDisplay?.subtextTitle;

  return (
    <button
      type="button"
      role="option"
      aria-selected={emphasized}
      aria-disabled={pickBlocked}
      disabled={pickBlocked}
      title={pickBlocked ? pickBlockedReason : showBusyNowHover ? undefined : hoverHint ?? undefined}
      onClick={() => {
        if (!pickBlocked) onPick();
      }}
      className={cn(
        'relative flex min-h-[4.75rem] flex-col rounded-md border bg-card text-left shadow-sm outline-none transition-colors',
        pickBlocked
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-brand-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        emphasized && !pickBlocked ? 'ring-1 ring-brand-primary/25 ring-offset-2 ring-offset-background border-brand-primary/40 bg-brand-primary/[0.06]' : tileBorderClass,
      )}
    >
      {isSelected ? (
        <span
          className="absolute right-1.5 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-primary-foreground shadow-sm"
          aria-hidden
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
      <div className={cn('h-2 shrink-0 rounded-t-md', topBarClass)} aria-hidden />
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <span className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{m.name}</span>
        {showBusyNowHover ? (
          <BusyNowStatusLine subtext={subtext} subtextClass={subtextClass} liveWork={liveWork} />
        ) : (
          <span className={cn('truncate text-[10px] font-semibold uppercase tracking-wide', subtextClass)}>
            {subtext}
          </span>
        )}
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
