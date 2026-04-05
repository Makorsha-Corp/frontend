import type { Machine, MachineEvent, MachineEventType } from '@/types/machine';

/**
 * Visual bucket for machine tiles/cards (green / yellow / red).
 * Derived from `Machine.is_running` plus optional latest `MachineEvent`
 * (MAINTENANCE is not represented by `is_running` alone).
 */
export type MachineVisualKind = 'running' | 'maintenance' | 'stopped';

export function getMachineVisualKind(
  machine: Machine,
  latestEvent?: MachineEvent | null | undefined
): MachineVisualKind {
  if (latestEvent?.event_type === 'MAINTENANCE') return 'maintenance';
  if (machine.is_running) return 'running';
  return 'stopped';
}

/** User-facing label for the current operational state. */
export function getMachineStatusLabel(
  machine: Machine,
  latestEvent?: MachineEvent | null | undefined
): string {
  if (latestEvent?.event_type === 'MAINTENANCE') return 'Maintenance';
  if (machine.is_running) return 'Running';
  if (latestEvent?.event_type === 'IDLE') return 'Idle';
  if (latestEvent?.event_type === 'OFF') return 'Off';
  return 'Not running';
}

/** Which event type button should appear selected in the detail card. */
export function getHighlightedEventType(
  machine: Machine,
  latestEvent?: MachineEvent | null | undefined
): MachineEventType {
  if (machine.is_running) return 'RUNNING';
  return latestEvent?.event_type ?? 'IDLE';
}

export const machineTopBarClass: Record<MachineVisualKind, string> = {
  running: 'bg-emerald-500',
  maintenance: 'bg-amber-500',
  stopped: 'bg-red-500',
};

export const machineBadgeClass: Record<MachineVisualKind, string> = {
  running:
    'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  maintenance:
    'border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  stopped: 'border border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-400',
};

/** Square icon holder for dashboards (factory/section headers, metric strip). */
const dashIconTileBase =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg';

/**
 * Brand (purple) tile — factory/section identity, machine list cog, fleet totals.
 * Ring matches the brand accent used when a machine row is selected.
 */
export const brandIconTileClass = `${dashIconTileBase} bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35`;

/**
 * Status metric tiles — same border/fill ratios as {@link machineBadgeClass} (icons use {@link statusMetricIconClass}).
 */
export const statusMetricTileClass: Record<MachineVisualKind, string> = {
  running: `${dashIconTileBase} border border-emerald-500/30 bg-emerald-500/15 dark:border-emerald-500/35 dark:bg-emerald-500/10`,
  maintenance: `${dashIconTileBase} border border-amber-500/40 bg-amber-500/15 dark:border-amber-500/45 dark:bg-amber-500/10`,
  stopped: `${dashIconTileBase} border border-red-500/35 bg-red-500/10 dark:border-red-500/40 dark:bg-red-500/10`,
};

/** Inactive / placeholder metrics (e.g. orders not wired, no maintenance due). */
export const neutralMetricTileClass = `${dashIconTileBase} border border-border/70 bg-muted/25 dark:border-border dark:bg-muted/20`;

export const brandIconGlyphClass = 'h-5 w-5 text-brand-primary';

export const statusMetricIconClass: Record<MachineVisualKind, string> = {
  running: 'h-5 w-5 text-emerald-700 dark:text-emerald-400',
  maintenance: 'h-5 w-5 text-amber-800 dark:text-amber-400',
  stopped: 'h-5 w-5 text-red-700 dark:text-red-400',
};

export const neutralMetricIconClass = 'h-5 w-5 text-muted-foreground';

export const machineSelectorTileClass = (kind: MachineVisualKind, isRowHighlighted: boolean) => {
  if (isRowHighlighted) {
    return 'ring-2 ring-brand-primary ring-offset-2 ring-offset-background border-brand-primary';
  }
  switch (kind) {
    case 'running':
      return 'border-emerald-500/40 ring-1 ring-emerald-500/15';
    case 'maintenance':
      return 'border-amber-500/45 ring-1 ring-amber-500/20';
    default:
      return 'border-red-500/30 ring-1 ring-red-500/10';
  }
};

export const machineSelectorSubtextClass: Record<MachineVisualKind, string> = {
  running: 'text-emerald-600 dark:text-emerald-400',
  maintenance: 'text-amber-700 dark:text-amber-400',
  stopped: 'text-red-600 dark:text-red-400',
};

/** Map a logged event type to the same green / amber / red family as the rest of the UI. */
export function machineVisualKindFromEventType(type: MachineEventType): MachineVisualKind {
  if (type === 'RUNNING') return 'running';
  if (type === 'MAINTENANCE') return 'maintenance';
  return 'stopped';
}

/** Filled style for the active status button on the machine detail card. */
export function activeEventButtonClass(type: MachineEventType): string {
  switch (type) {
    case 'RUNNING':
      return 'bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600';
    case 'MAINTENANCE':
      return 'bg-amber-500 hover:bg-amber-500 text-amber-950 border-amber-500';
    case 'IDLE':
    case 'OFF':
      return 'bg-red-600 hover:bg-red-600 text-white border-red-600';
    default:
      return '';
  }
}
