import type { Machine, MachineEventType } from '@/types/machine';

/**
 * Visual bucket for machine tiles/cards (green / yellow / red).
 * Derived from `Machine.is_running` plus optional `latest_status_type`
 * (MAINTENANCE is not represented by `is_running` alone).
 */
export type MachineVisualKind = 'running' | 'maintenance' | 'stopped';

export function getMachineVisualKind(machine: Machine): MachineVisualKind {
  if (machine.latest_status_type === 'MAINTENANCE') return 'maintenance';
  if (machine.is_running) return 'running';
  return 'stopped';
}

/** User-facing label for the current operational state. */
export function getMachineStatusLabel(machine: Machine): string {
  if (machine.latest_status_type === 'MAINTENANCE') return 'Maintenance';
  if (machine.is_running) return 'Running';
  if (machine.latest_status_type === 'IDLE') return 'Idle';
  if (machine.latest_status_type === 'OFF') return 'Off';
  return 'Not running';
}

/** Which event type button should appear selected in the detail card. */
export function getHighlightedEventType(machine: Machine): MachineEventType {
  if (machine.is_running) return 'RUNNING';
  return machine.latest_status_type ?? 'IDLE';
}

/** Softer accent strip on detail panels and dialogs. */
export const machineTopBarClass: Record<MachineVisualKind, string> = {
  running: 'bg-emerald-500/70 dark:bg-emerald-500/55',
  maintenance: 'bg-amber-500/75 dark:bg-amber-500/60',
  stopped: 'bg-red-500/65 dark:bg-red-500/50',
};

/** Solid vibrant strip on machine list / selector cards. */
export const machineListTopBarClass: Record<MachineVisualKind, string> = {
  running: 'bg-emerald-500',
  maintenance: 'bg-amber-500',
  stopped: 'bg-red-500',
};

export const machineBadgeClass: Record<MachineVisualKind, string> = {
  running:
    'border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  maintenance:
    'border border-amber-500/45 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  stopped: 'border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-400',
};

/** Segment fills for status bars (Factories panel). */
export const machineStatusSegmentClass: Record<MachineVisualKind, string> = {
  running: 'bg-emerald-500/80 dark:bg-emerald-500/65',
  maintenance: 'bg-amber-500/85 dark:bg-amber-500/70',
  stopped: 'bg-red-500/75 dark:bg-red-500/60',
};

/** KPI / footer text tint aligned with badge colors. */
export const machineKpiValueClass: Record<MachineVisualKind, string> = {
  running: 'text-emerald-700 dark:text-emerald-400',
  maintenance: 'text-amber-800 dark:text-amber-400',
  stopped: 'text-red-700 dark:text-red-400',
};

/** Square icon holder for dashboards (factory/section headers, metric strip). */
const dashIconTileBase =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg';

export const brandIconTileClass = `${dashIconTileBase} bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35`;

export const statusMetricTileClass: Record<MachineVisualKind, string> = {
  running: `${dashIconTileBase} border border-emerald-500/40 bg-emerald-500/15`,
  maintenance: `${dashIconTileBase} border border-amber-500/45 bg-amber-500/15`,
  stopped: `${dashIconTileBase} border border-red-500/40 bg-red-500/15`,
};

export const neutralMetricTileClass = `${dashIconTileBase} border border-border bg-muted/20`;

export const brandIconGlyphClass = 'h-5 w-5 text-brand-primary';

export const statusMetricIconClass: Record<MachineVisualKind, string> = {
  running: 'h-5 w-5 text-emerald-700 dark:text-emerald-400',
  maintenance: 'h-5 w-5 text-amber-800 dark:text-amber-400',
  stopped: 'h-5 w-5 text-red-700 dark:text-red-400',
};

export const neutralMetricIconClass = 'h-5 w-5 text-muted-foreground';

export const machineListCardSelectedClass =
  'border-brand-primary/40 bg-brand-primary/[0.08] ring-1 ring-brand-primary/25 shadow-sm';

export const machineSelectorTileClass = (kind: MachineVisualKind, isRowHighlighted: boolean) => {
  if (isRowHighlighted) {
    return 'ring-1 ring-brand-primary/25 ring-offset-2 ring-offset-background border-brand-primary/40 bg-brand-primary/[0.06]';
  }
  switch (kind) {
    case 'running':
      return 'border-emerald-500/25 ring-1 ring-emerald-500/10';
    case 'maintenance':
      return 'border-amber-500/30 ring-1 ring-amber-500/10';
    default:
      return 'border-red-500/25 ring-1 ring-red-500/10';
  }
};

export const machineSelectorSubtextClass: Record<MachineVisualKind, string> = {
  running: 'text-emerald-700 dark:text-emerald-400',
  maintenance: 'text-amber-800 dark:text-amber-400',
  stopped: 'text-red-700 dark:text-red-400',
};

export function machineVisualKindFromEventType(type: MachineEventType): MachineVisualKind {
  if (type === 'RUNNING') return 'running';
  if (type === 'MAINTENANCE') return 'maintenance';
  return 'stopped';
}

/** Tinted outline for the active status button on machine detail surfaces. */
export function activeEventButtonClass(type: MachineEventType): string {
  switch (type) {
    case 'RUNNING':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400';
    case 'MAINTENANCE':
      return 'border-amber-500/45 bg-amber-500/15 text-amber-800 hover:bg-amber-500/20 dark:text-amber-400';
    case 'IDLE':
      return 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/50';
    case 'OFF':
      return 'border-red-500/40 bg-red-500/15 text-red-700 hover:bg-red-500/20 dark:text-red-400';
    default:
      return '';
  }
}
