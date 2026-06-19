export type NotificationKind =
  | 'approval_pending'
  | 'approval_assigned'
  | 'section_confirm'
  | 'invoice_action'
  | 'low_stock'
  | 'project_update'
  | 'maintenance'
  | 'system';

export type NotificationSeverity = 'urgent' | 'action' | 'info';

export type NotificationFilter = 'all' | 'unread' | 'approvals' | 'alerts';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  entityRef?: string;
}

export type NotificationPreferenceKey =
  | 'order_approvals'
  | 'low_stock'
  | 'project_updates'
  | 'maintenance'
  | 'system';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  order_approvals: true,
  low_stock: true,
  project_updates: true,
  maintenance: true,
  system: true,
};

export const APPROVAL_KINDS: NotificationKind[] = [
  'approval_pending',
  'approval_assigned',
  'section_confirm',
  'invoice_action',
];

export const ALERT_KINDS: NotificationKind[] = [
  'low_stock',
  'project_update',
  'maintenance',
  'system',
];

export function kindMatchesFilter(kind: NotificationKind, filter: NotificationFilter): boolean {
  if (filter === 'all' || filter === 'unread') return true;
  if (filter === 'approvals') return APPROVAL_KINDS.includes(kind);
  if (filter === 'alerts') return ALERT_KINDS.includes(kind);
  return true;
}

export function preferenceKeyForKind(kind: NotificationKind): NotificationPreferenceKey {
  if (APPROVAL_KINDS.includes(kind)) return 'order_approvals';
  if (kind === 'low_stock') return 'low_stock';
  if (kind === 'project_update') return 'project_updates';
  if (kind === 'maintenance') return 'maintenance';
  return 'system';
}
