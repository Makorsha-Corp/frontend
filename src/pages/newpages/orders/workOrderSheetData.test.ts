import { describe, expect, it } from 'vitest';

import { getSheetDateStatusSublabel } from './workOrderSheetData';

describe('getSheetDateStatusSublabel', () => {
  it('shows Recurring for draft rows from a recurring template', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'DRAFT',
      isRecurringFromTemplate: true,
    });
    expect(sublabel?.label).toBe('Recurring');
    expect(sublabel?.className).toContain('violet');
  });

  it('shows Draft for draft rows without recurring template', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'DRAFT',
      isRecurringFromTemplate: false,
    });
    expect(sublabel?.label).toBe('Draft');
  });

  it('shows In progress for in-progress recurring rows', () => {
    const sublabel = getSheetDateStatusSublabel({
      status: 'IN_PROGRESS',
      isRecurringFromTemplate: true,
    });
    expect(sublabel?.label).toBe('Active');
  });
});
