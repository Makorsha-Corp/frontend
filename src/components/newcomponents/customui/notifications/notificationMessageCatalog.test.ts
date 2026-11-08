import { describe, expect, it } from 'vitest';

import type { BackendNotification } from '@/types/notification';
import {
  APPROVAL_ASSIGNED_READY_PREVIEW_MARKER,
  INVOICE_PREVIEW_CONFIRMED_PREFIX,
  englishTitleFromKey,
  resolveNotificationBodyMeta,
  resolveNotificationTitleKey,
} from './notificationMessageCatalog';

function baseNotification(
  overrides: Partial<BackendNotification> = {},
): BackendNotification {
  return {
    id: 1,
    workspace_id: 1,
    notification_type: 'approval_pending',
    entity_type: 'purchase_order',
    entity_id: 42,
    entity_label: 'PO-TOUR-SAMPLE',
    source_type: 'order',
    source_id: 42,
    preview: null,
    is_read: false,
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
    actor: { id: 2, name: 'Amina' },
    ...overrides,
  };
}

describe('resolveNotificationTitleKey', () => {
  it('maps approval_pending to catalog key', () => {
    const n = baseNotification({ notification_type: 'approval_pending' });
    const { titleKey, titleParams } = resolveNotificationTitleKey(n, 'approval_pending', false, 'PO-1');
    expect(titleKey).toBe('titleApprovalPending');
    expect(titleParams.ref).toBe('PO-1');
    expect(englishTitleFromKey(titleKey, titleParams)).toContain('PO-1');
  });

  it('uses structured marker for approval_assigned needs variant', () => {
    const n = baseNotification({
      notification_type: 'approval_assigned',
      preview: `Assigned by Amina${APPROVAL_ASSIGNED_READY_PREVIEW_MARKER}2/3 approved`,
    });
    const { titleKey } = resolveNotificationTitleKey(n, 'approval_assigned', false, 'PO-1');
    expect(titleKey).toBe('titleApprovalAssignedNeeds');
  });

  it('uses default approval_assigned title without marker', () => {
    const n = baseNotification({
      notification_type: 'approval_assigned',
      preview: 'Assigned by Amina on PO-1',
    });
    const { titleKey } = resolveNotificationTitleKey(n, 'approval_assigned', false, 'PO-1');
    expect(titleKey).toBe('titleApprovalAssigned');
  });

  it('uses invoice confirmed prefix', () => {
    const n = baseNotification({
      notification_type: 'invoice_action',
      preview: `${INVOICE_PREVIEW_CONFIRMED_PREFIX}Invoice confirmed on PO-1 — order locked`,
    });
    const { titleKey } = resolveNotificationTitleKey(n, 'invoice_action', false, 'PO-1');
    expect(titleKey).toBe('titleInvoiceConfirmed');
  });
});

describe('resolveNotificationBodyMeta', () => {
  it('splits invoice preview body after pipe', () => {
    const n = baseNotification({
      notification_type: 'invoice_action',
      preview: 'confirmed|Invoice confirmed on PO-1 — order locked',
    });
    const meta = resolveNotificationBodyMeta(n, 'invoice_action');
    expect(meta.bodyFromPreview).toBe(true);
    expect(meta.body).toBe('Invoice confirmed on PO-1 — order locked');
  });

  it('uses catalog body when no preview', () => {
    const n = baseNotification({ notification_type: 'approval_pending', preview: null });
    const meta = resolveNotificationBodyMeta(n, 'approval_pending');
    expect(meta.bodyFromPreview).toBe(false);
    expect(meta.bodyKey).toBe('bodyApprovalPending');
  });
});
