import { startOfDay } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  canCompleteWorkOrderAsPlanned,
  isPlannedDateOnOrBeforeToday,
} from './workOrderPlannedClose';

const TODAY = startOfDay(new Date('2026-07-24'));

describe('workOrderPlannedClose', () => {
  it('detects planned date on or before today', () => {
    expect(isPlannedDateOnOrBeforeToday('2026-07-23', TODAY)).toBe(true);
    expect(isPlannedDateOnOrBeforeToday('2026-07-24', TODAY)).toBe(true);
    expect(isPlannedDateOnOrBeforeToday('2026-07-25', TODAY)).toBe(false);
  });

  it('allows complete as planned for approved past draft', () => {
    expect(canCompleteWorkOrderAsPlanned('DRAFT', '2026-07-20', true, TODAY)).toBe(true);
  });

  it('blocks complete as planned for future draft', () => {
    expect(canCompleteWorkOrderAsPlanned('DRAFT', '2026-07-30', true, TODAY)).toBe(false);
  });

  it('blocks complete as planned when approvals not met', () => {
    expect(canCompleteWorkOrderAsPlanned('DRAFT', '2026-07-20', false, TODAY)).toBe(false);
  });
});
