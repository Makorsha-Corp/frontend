export interface ParsedMaintenanceContext {
  factory: string;
  section: string;
  status: string;
  type: string;
}

export function parseMaintenanceContextLabel(contextLabel: string): ParsedMaintenanceContext {
  const parts = contextLabel.split(' · ');
  return {
    factory: parts[0] ?? '',
    section: parts[1] ?? '',
    status: parts[2] ?? '',
    type: parts[3] ?? parts[parts.length - 1] ?? '',
  };
}

export function maintenanceStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'scheduled') {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
  }
  if (normalized === 'draft') {
    return 'border-border text-muted-foreground';
  }
  if (normalized.includes('progress')) {
    return 'border-green-600/30 bg-green-500/10 text-green-700 dark:text-green-300';
  }
  return '';
}

export function maintenanceLocationLabel(context: ParsedMaintenanceContext): string {
  return [context.factory, context.section, context.type].filter(Boolean).join(' · ');
}

export const maintenanceRowLinkClass =
  'group rounded-lg border border-border/80 bg-card shadow-sm transition-colors hover:border-brand-primary/35 hover:bg-brand-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
