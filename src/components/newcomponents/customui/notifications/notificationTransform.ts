import { DISCUSSION_URL_HASH } from '@/constants/discussion';
import type { BackendNotification } from '@/types/notification';
import type { AppNotification } from './notificationTypes';

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

function buildDiscussionTitle(n: BackendNotification): string {
  const actor = n.actor?.name ?? 'Someone';
  const ref = formatNotificationEntityRef(n.entity_type, n.entity_id);
  return `${actor} mentioned you on ${ref}`;
}

export function transformBackendNotification(n: BackendNotification): AppNotification {
  const discussion = isDiscussionNotification(n);

  return {
    id: `api_${n.id}`,
    kind: 'mention',
    severity: 'info',
    title: discussion ? buildDiscussionTitle(n) : `${n.actor?.name ?? 'Someone'} notified you`,
    body: n.preview?.trim() || 'Open the discussion to read the full message.',
    href: entityTypeToHref(n.entity_type, n.entity_id, { scrollToDiscussion: discussion }),
    createdAt: n.created_at,
    entityRef: formatNotificationEntityRef(n.entity_type, n.entity_id),
  };
}
