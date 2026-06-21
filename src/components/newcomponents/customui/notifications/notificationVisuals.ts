import {
  AlertCircle,
  AtSign,
  Bell,
  ClipboardCheck,
  FileText,
  Package,
  UserPlus,
  Wrench,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationKind, NotificationSeverity } from './notificationTypes';

export interface NotificationVisual {
  icon: LucideIcon;
  colorClass: string;
  wrapClass: string;
}

const KIND_VISUALS: Record<NotificationKind, Omit<NotificationVisual, 'colorClass'> & { severity: NotificationSeverity }> = {
  approval_pending: { icon: ClipboardCheck, wrapClass: 'bg-brand-primary/10', severity: 'urgent' },
  approval_assigned: { icon: UserPlus, wrapClass: 'bg-brand-primary/10', severity: 'action' },
  section_confirm: { icon: ClipboardCheck, wrapClass: 'bg-muted', severity: 'action' },
  invoice_action: { icon: FileText, wrapClass: 'bg-muted', severity: 'action' },
  low_stock: { icon: Package, wrapClass: 'bg-destructive/10', severity: 'urgent' },
  project_update: { icon: FolderKanban, wrapClass: 'bg-muted', severity: 'info' },
  maintenance: { icon: Wrench, wrapClass: 'bg-muted', severity: 'action' },
  system:  { icon: Bell,    wrapClass: 'bg-muted',             severity: 'info'   },
  mention: { icon: AtSign,  wrapClass: 'bg-blue-500/10',       severity: 'info'   },
};

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  urgent: 'text-destructive',
  action: 'text-brand-primary',
  info: 'text-muted-foreground',
};

export function getNotificationVisual(kind: NotificationKind, severity?: NotificationSeverity): NotificationVisual {
  const entry = KIND_VISUALS[kind];
  const resolvedSeverity = severity ?? entry.severity;
  return {
    icon: entry.icon,
    wrapClass: entry.wrapClass,
    colorClass: SEVERITY_COLORS[resolvedSeverity],
  };
}

export function getFilterEmptyMessage(filter: string): string {
  switch (filter) {
    case 'unread':
      return 'No unread notifications';
    case 'approvals':
      return 'No approval notifications';
    case 'alerts':
      return 'No alert notifications';
    default:
      return 'No notifications';
  }
}

export const FALLBACK_VISUAL: NotificationVisual = {
  icon: AlertCircle,
  colorClass: 'text-muted-foreground',
  wrapClass: 'bg-muted',
};
