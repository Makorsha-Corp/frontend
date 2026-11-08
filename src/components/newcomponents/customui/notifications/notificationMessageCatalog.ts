import type { BackendNotification } from '@/types/notification';
import enNotifications from '@/i18n/locales/en/notifications.json';
import type { NotificationKind } from './notificationTypes';

/** Backend `notify_approval_assigned(..., ready_for_approval=True)` preview segment — not UI copy. */
export const APPROVAL_ASSIGNED_READY_PREVIEW_MARKER = ' · ready for your approval · ';

/** Backend invoice notification preview prefix (`approval_notification_service`). */
export const INVOICE_PREVIEW_CONFIRMED_PREFIX = 'confirmed|';

type NotificationCopyKey = keyof typeof enNotifications;

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? '');
}

/** English catalog strings for `defaultValue` / SSR-safe fallback (single source with `en/notifications.json`). */
export function englishNotificationString(
  key: NotificationCopyKey,
  params?: Record<string, string>,
): string {
  const template = enNotifications[key];
  if (typeof template !== 'string') return String(key);
  const merged = { ...(params ?? {}) };
  if ((key === 'titleMention' || key === 'titleGenericNotify') && !merged.actor?.trim()) {
    merged.actor = enNotifications.someone;
  }
  return interpolate(template, merged);
}

export function resolveNotificationTitleKey(
  n: BackendNotification,
  kind: NotificationKind,
  discussion: boolean,
  ref: string,
): { titleKey: NotificationCopyKey; titleParams: Record<string, string> } {
  if (discussion) {
    return {
      titleKey: 'titleMention',
      titleParams: { actor: n.actor?.name?.trim() ?? '', ref },
    };
  }

  switch (kind) {
    case 'approval_pending':
      return { titleKey: 'titleApprovalPending', titleParams: { ref } };
    case 'approval_assigned': {
      const preview = n.preview ?? '';
      const needsApproval = preview.includes(APPROVAL_ASSIGNED_READY_PREVIEW_MARKER);
      return {
        titleKey: needsApproval ? 'titleApprovalAssignedNeeds' : 'titleApprovalAssigned',
        titleParams: { ref },
      };
    }
    case 'section_confirm':
      return { titleKey: 'titleSectionConfirm', titleParams: { ref } };
    case 'invoice_action': {
      const preview = n.preview ?? '';
      const isConfirmed = preview.startsWith(INVOICE_PREVIEW_CONFIRMED_PREFIX);
      return {
        titleKey: isConfirmed ? 'titleInvoiceConfirmed' : 'titleDraftInvoiceReady',
        titleParams: { ref },
      };
    }
    default:
      return {
        titleKey: 'titleGenericNotify',
        titleParams: { actor: n.actor?.name?.trim() ?? '' },
      };
  }
}

const BODY_KEY_BY_KIND: Partial<Record<NotificationKind, NotificationCopyKey>> = {
  approval_pending: 'bodyApprovalPending',
  approval_assigned: 'bodyApprovalAssigned',
  section_confirm: 'bodySectionConfirm',
  invoice_action: 'bodyInvoiceAction',
  mention: 'bodyMention',
  system: 'bodyDefault',
};

export function resolveNotificationBodyMeta(
  n: BackendNotification,
  kind: NotificationKind,
): { body: string; bodyKey?: NotificationCopyKey; bodyFromPreview: boolean } {
  const preview = n.preview?.trim();

  if (kind === 'invoice_action' && preview?.includes('|')) {
    const body = preview.split('|').slice(1).join('|').trim();
    return { body, bodyFromPreview: true };
  }
  if (preview) {
    return { body: preview, bodyFromPreview: true };
  }

  const bodyKey = BODY_KEY_BY_KIND[kind] ?? 'bodyDefault';
  return {
    body: englishNotificationString(bodyKey),
    bodyKey,
    bodyFromPreview: false,
  };
}

export function englishTitleFromKey(
  titleKey: NotificationCopyKey,
  titleParams: Record<string, string>,
): string {
  return englishNotificationString(titleKey, titleParams);
}
