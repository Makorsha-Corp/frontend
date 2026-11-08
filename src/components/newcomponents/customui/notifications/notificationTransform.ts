import { DISCUSSION_URL_HASH } from '@/constants/discussion';
import { buildWorkOrderHref } from '@/lib/entityLinks';
import type { BackendNotification } from '@/types/notification';
import type { AppNotification, NotificationKind, NotificationSeverity } from './notificationTypes';
import {
  englishTitleFromKey,
  resolveNotificationBodyMeta,
  resolveNotificationTitleKey,
} from './notificationMessageCatalog';

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
      path = buildWorkOrderHref(entityId);
      break;
    case 'sales_order':
      path = `/sales/overview?orderId=${entityId}`;
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

export function formatNotificationEntityRef(
  entityType: string,
  entityId: number,
  entityLabel?: string | null,
): string {
  const trimmed = entityLabel?.trim();
  if (trimmed) return trimmed;
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

export function transformBackendNotification(n: BackendNotification): AppNotification {
  const kind = mapNotificationKind(n);
  const discussion = kind === 'mention';
  const ref = formatNotificationEntityRef(n.entity_type, n.entity_id, n.entity_label);
  const { titleKey, titleParams } = resolveNotificationTitleKey(n, kind, discussion, ref);
  const bodyMeta = resolveNotificationBodyMeta(n, kind);

  return {
    id: `api_${n.id}`,
    kind,
    severity: defaultSeverity(kind),
    title: englishTitleFromKey(titleKey, titleParams),
    body: bodyMeta.body,
    href: entityTypeToHref(n.entity_type, n.entity_id, { scrollToDiscussion: discussion }),
    createdAt: n.created_at,
    entityRef: ref,
    titleKey,
    titleParams,
    bodyKey: bodyMeta.bodyKey,
    bodyFromPreview: bodyMeta.bodyFromPreview,
  };
}
