import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActionMessage } from '@/types/common';

import { formatActionMessages, showActionMessages } from '@/lib/actionResponseToasts';

vi.mock('@/lib/appToast', () => ({
  appToast: {
    success: vi.fn(),
    error: vi.fn(),
    neutral: vi.fn(),
  },
}));

import { appToast } from '@/lib/appToast';

const TIMESTAMP = '2026-01-01T00:00:00Z';

function actionMessage(type: ActionMessage['type'], message: string): ActionMessage {
  return { type, message, timestamp: TIMESTAMP };
}

describe('formatActionMessages', () => {
  it('returns empty string for no messages', () => {
    expect(formatActionMessages([])).toBe('');
  });

  it('returns single message text unchanged', () => {
    expect(formatActionMessages([actionMessage('success', 'Line item marked as fulfilled')])).toBe(
      'Line item marked as fulfilled',
    );
  });

  it('combines mixed success and info with success first', () => {
    const combined = formatActionMessages([
      actionMessage('info', 'Inventory updated: 2 items, 50 units deducted'),
      actionMessage('success', 'Delivery DEL-2025-001 marked as completed'),
      actionMessage('info', '120 units remaining to be delivered'),
    ]);
    expect(combined).toBe(
      'Delivery DEL-2025-001 marked as completed · Inventory updated: 2 items, 50 units deducted · 120 units remaining to be delivered',
    );
  });
});

describe('showActionMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when messages are empty or undefined', () => {
    showActionMessages(undefined);
    showActionMessages([]);
    expect(appToast.success).not.toHaveBeenCalled();
    expect(appToast.error).not.toHaveBeenCalled();
    expect(appToast.neutral).not.toHaveBeenCalled();
  });

  it('shows one success toast for a single success message', () => {
    showActionMessages([actionMessage('success', 'Line item marked as fulfilled')]);
    expect(appToast.success).toHaveBeenCalledWith('Line item marked as fulfilled');
    expect(appToast.neutral).not.toHaveBeenCalled();
  });

  it('shows one combined success toast for multiple success and info messages', () => {
    showActionMessages([
      actionMessage('success', 'Line item marked as fulfilled'),
      actionMessage('success', 'Sales order SO-2025-001 is now fully delivered'),
    ]);
    expect(appToast.success).toHaveBeenCalledWith(
      'Line item marked as fulfilled · Sales order SO-2025-001 is now fully delivered',
    );
  });

  it('uses neutral toast for info-only bundles', () => {
    showActionMessages([
      actionMessage('info', 'Inventory updated: 2 items, 50 units deducted'),
      actionMessage('info', '120 units remaining to be delivered'),
    ]);
    expect(appToast.neutral).toHaveBeenCalledWith(
      'Inventory updated: 2 items, 50 units deducted · 120 units remaining to be delivered',
    );
    expect(appToast.success).not.toHaveBeenCalled();
  });
});
