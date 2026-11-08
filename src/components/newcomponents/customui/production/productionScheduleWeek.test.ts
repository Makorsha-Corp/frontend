import { describe, expect, it } from 'vitest';
import { buildSheetPeriodLabel } from '@/pages/newpages/orders/workOrderSheetData';
import {
  buildProductionScheduleWeekRange,
  normalizeProductionScheduleWeekAnchor,
  productionScheduleWeekPeriodLabel,
  productionScheduleWeekStart,
} from '@/components/newcomponents/customui/production/productionScheduleWeek';

describe('productionScheduleWeek', () => {
  it('week starts on Sunday', () => {
    const wednesday = new Date(2026, 9, 22);
    const sunday = productionScheduleWeekStart(wednesday);
    expect(sunday.getDay()).toBe(0);
    expect(sunday.getDate()).toBe(18);
  });

  it('buildProductionScheduleWeekRange returns seven Sun-Sat days', () => {
    const range = buildProductionScheduleWeekRange('2026-10-25');
    expect(range.days).toHaveLength(7);
    expect(range.days[0].getDay()).toBe(0);
    expect(range.days[6].getDay()).toBe(6);
  });

  it('normalizeProductionScheduleWeekAnchor snaps to week start', () => {
    expect(normalizeProductionScheduleWeekAnchor('2026-10-28')).toBe('2026-10-25');
  });

  it('period label matches work-order sheet format', () => {
    const fromHelper = buildSheetPeriodLabel('week', '2026-10-25');
    const fromSchedule = productionScheduleWeekPeriodLabel('2026-10-25');
    expect(fromSchedule).toBe(fromHelper);
    expect(fromSchedule).toMatch(/Sun.*Sat/i);
  });
});
