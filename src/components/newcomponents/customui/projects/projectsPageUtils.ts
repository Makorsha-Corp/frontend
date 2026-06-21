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
    PLANNING: 'bg-brand-primary/10 text-brand-primary',
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
  'border-l-2 border-brand-primary bg-brand-primary/[0.08] dark:bg-brand-primary/15';

export const projectNavigatorRowBaseClass = 'border-l-2 border-transparent';

export const projectNavigatorRowHoverClass = 'hover:bg-muted/40';

/** Member avatar palette — brand-derived, no rainbow Tailwind hues */
export const PROJECT_MEMBER_AVATAR_COLORS = [
  'bg-brand-primary text-white',
  'bg-brand-primary/85 text-white',
  'bg-brand-accent text-card-foreground dark:text-accent-foreground',
  'bg-muted text-muted-foreground',
] as const;

export function projectMemberAvatarColor(userId: number): string {
  return PROJECT_MEMBER_AVATAR_COLORS[userId % PROJECT_MEMBER_AVATAR_COLORS.length];
}

/** Event log icon category styles */
export type ProjectEventVisualCategory = 'primary' | 'neutral' | 'success' | 'warning' | 'destructive';

export const PROJECT_EVENT_CATEGORY_STYLES: Record<
  ProjectEventVisualCategory,
  { wrap: string; color: string }
> = {
  primary: { wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  neutral: { wrap: 'bg-muted', color: 'text-muted-foreground' },
  success: { wrap: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  warning: { wrap: 'bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
  destructive: { wrap: 'bg-destructive/10', color: 'text-destructive' },
};
