import type { ProjectStatus } from '@/types/project';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNING',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

export const getStatusBadge = (status: ProjectStatus) => {
  const map: Record<ProjectStatus, string> = {
    PLANNING: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    IN_PROGRESS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    ON_HOLD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    COMPLETED: 'bg-muted text-muted-foreground',
    CANCELLED: 'bg-destructive/10 text-destructive',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
};

export const formatProjectStatus = (status: ProjectStatus | null | undefined) =>
  (status ?? 'PLANNING').replace('_', ' ');

/** Selected row in project/component navigator lists (tree, classic, etc.) */
export const projectNavigatorRowSelectedClass =
  'border-l-2 border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20';

export const projectNavigatorRowBaseClass = 'border-l-2 border-transparent';
