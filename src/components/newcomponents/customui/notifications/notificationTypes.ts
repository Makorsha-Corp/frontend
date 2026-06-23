export type NotificationKind =
  | 'approval_pending'
  | 'approval_assigned'
  | 'section_confirm'
  | 'invoice_action'
  | 'low_stock'
  | 'project_update'
  | 'maintenance'
  | 'system'
  | 'mention';

export type NotificationSeverity = 'urgent' | 'action' | 'info';

export type NotificationFilter = 'all' | 'unread' | 'approvals' | 'alerts' | 'discussions';

export const NOTIFICATION_FILTERS: NotificationFilter[] = [
  'all',
  'unread',
  'approvals',
  'alerts',
  'discussions',
];

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

export const DISCUSSION_KINDS: NotificationKind[] = ['mention'];

export function kindMatchesFilter(kind: NotificationKind, filter: NotificationFilter): boolean {
  if (filter === 'all' || filter === 'unread') return true;
  if (filter === 'approvals') return APPROVAL_KINDS.includes(kind);
  if (filter === 'alerts') return ALERT_KINDS.includes(kind);
  if (filter === 'discussions') return DISCUSSION_KINDS.includes(kind);
  return true;
}
