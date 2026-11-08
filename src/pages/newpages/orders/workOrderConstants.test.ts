import { describe, expect, it } from 'vitest';

import {
  isWorkOrderPreStart,
  workOrderStatusShortLabel,
} from '@/pages/newpages/orders/workOrderConstants';

describe('workOrderConstants — RECURRING', () => {
  it('treats RECURRING as pre-start', () => {
    expect(isWorkOrderPreStart('RECURRING')).toBe(true);
    expect(isWorkOrderPreStart('DRAFT')).toBe(true);
    expect(isWorkOrderPreStart('IN_PROGRESS')).toBe(false);
  });

  it('short label for RECURRING is Rec', () => {
    expect(workOrderStatusShortLabel('RECURRING')).toBe('Rec');
  });
});
