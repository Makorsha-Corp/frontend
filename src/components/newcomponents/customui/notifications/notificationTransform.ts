import { DISCUSSION_URL_HASH } from '@/constants/discussion';
import type { BackendNotification } from '@/types/notification';
import type { AppNotification, NotificationKind, NotificationSeverity } from './notificationTypes';

const ENTITY_ORDER_PREFIX: Record<string, string> = {
  purchase_order: 'PO',
  transfer_order: 'TO',
  expense_order: 'EXP',
  work_order: 'WO',
  sales_order: 'SO',
};

const ENTITY_TYPE_LABEL: Record<string, string> = {
  purchase_order: 'purchase order',
  transfer_order: 'transfer order',
  expense_order: 'expense order',
  work_order: 'work order',
  sales_order: 'sales order',
  project: 'project',
  project_component: 'project component',
  machine: 'machine',
};

const APPROVAL_NOTIFICATION_TYPES = new Set<string>([
  'approval_pending',
  'approval_assigned',
  'section_confirm',
  'invoice_action',
]);

export function entityTypeToHref(
  entityType: string,
  entityId: number,
  options?: { scrollToDiscussion?: boolean }
): string {
  let path = '/';
  switch (entityType) {
    case 'purchase_order':
      path = `/orders/purchase?orderId=${entityId}`;
      break;
    case 'transfer_order':
      path = `/orders/transfer?orderId=${entityId}`;
      break;
    case 'expense_order':
      path = `/orders/expense?orderId=${entityId}`;
      break;
    case 'work_order':
      path = `/orders/work?orderId=${entityId}`;
      break;
    case 'sales_order':
      path = `/orders/sales?orderId=${entityId}`;
      break;
    case 'project':
      path = `/projects?projectId=${entityId}`;
      break;
    case 'project_component':
      path = `/projects?componentId=${entityId}`;
      break;
    case 'machine':
      path = `/machines?machineId=${entityId}`;
      break;
    default:
      break;
  }

  if (options?.scrollToDiscussion) {
    return `${path}#${DISCUSSION_URL_HASH}`;
  }
  return path;
}

export function formatNotificationEntityRef(entityType: string, entityId: number): string {
  const prefix = ENTITY_ORDER_PREFIX[entityType];
  if (prefix) return `${prefix}-${entityId}`;
  const label = ENTITY_TYPE_LABEL[entityType] ?? entityType.replace(/_/g, ' ');
  return `${label} #${entityId}`;
}

function isDiscussionNotification(n: BackendNotification): boolean {
  return n.notification_type === 'mention' || n.source_type === 'discussion';
}

function mapNotificationKind(n: BackendNotification): NotificationKind {
  if (APPROVAL_NOTIFICATION_TYPES.has(n.notification_type)) {
    return n.notification_type as NotificationKind;
  }
  if (isDiscussionNotification(n)) {
    return 'mention';
  }
  return 'system';
}

function defaultSeverity(kind: NotificationKind): NotificationSeverity {
  switch (kind) {
    case 'approval_pending':
    case 'low_stock':
      return 'urgent';
    case 'approval_assigned':
    case 'section_confirm':
    case 'invoice_action':
    case 'maintenance':
      return 'action';
    default:
      return 'info';
  }
}

function buildDiscussionTitle(n: BackendNotification): string {
  const actor = n.actor?.name ?? 'Someone';
  const ref = formatNotificationEntityRef(n.entity_type, n.entity_id);
  return `${actor} mentioned you on ${ref}`;
}

function buildApprovalTitle(n: BackendNotification, kind: NotificationKind): string {
  const ref = formatNotificationEntityRef(n.entity_type, n.entity_id);
  switch (kind) {
    case 'approval_pending':
      return `${ref} needs your approval`;
    case 'approval_assigned': {
      const preview = n.preview ?? '';
      if (preview.includes('ready for your approval')) {
        return `You were added as approver on ${ref} — approval needed`;
      }
      return `You were added as approver on ${ref}`;
    }
    case 'section_confirm':
      return `Confirm sections on ${ref}`;
    case 'invoice_action': {
      const preview = n.preview ?? '';
      const isConfirmed = preview.startsWith('confirmed|');
      return isConfirmed
        ? `Invoice confirmed on ${ref}`
        : `Draft invoice ready on ${ref}`;
    }
    default:
      return `${n.actor?.name ?? 'Someone'} notified you`;
  }
}

function buildNotificationBody(n: BackendNotification, kind: NotificationKind): string {
  const preview = n.preview?.trim();
  if (kind === 'invoice_action' && preview?.includes('|')) {
    return preview.split('|').slice(1).join('|').trim();
  }
  if (preview) return preview;

  switch (kind) {
    case 'approval_pending':
      return 'This order is ready for your review and sign-off.';
    case 'approval_assigned':
      return 'Open the order to review details and approve when ready.';
    case 'section_confirm':
      return 'Complete remaining sections before approvals can proceed.';
    case 'invoice_action':
      return 'Open the order to review the linked invoice.';
    case 'mention':
      return 'Open the discussion to read the full message.';
    default:
      return 'Open to view details.';
  }
}

export function transformBackendNotification(n: BackendNotification): AppNotification {
  const kind = mapNotificationKind(n);
  const discussion = kind === 'mention';

  return {
    id: `api_${n.id}`,
    kind,
    severity: defaultSeverity(kind),
    title: discussion ? buildDiscussionTitle(n) : buildApprovalTitle(n, kind),
    body: buildNotificationBody(n, kind),
    href: entityTypeToHref(n.entity_type, n.entity_id, { scrollToDiscussion: discussion }),
    createdAt: n.created_at,
    entityRef: formatNotificationEntityRef(n.entity_type, n.entity_id),
  };
}
