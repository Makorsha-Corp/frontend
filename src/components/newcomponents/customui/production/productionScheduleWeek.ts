import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import {
  buildSheetPeriodLabel,
  SHEET_WEEK_STARTS_ON,
  sheetPeriodBounds,
} from '@/pages/newpages/orders/workOrderSheetData';

/** Sun → Sat — same as machine / work-order sheets. */
export { SHEET_WEEK_STARTS_ON as PRODUCTION_SCHEDULE_WEEK_STARTS_ON };

export function productionScheduleWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: SHEET_WEEK_STARTS_ON });
}

export function productionScheduleWeekPeriodLabel(weekAnchorIso: string): string | null {
  return buildSheetPeriodLabel('week', weekAnchorIso);
}

export function buildProductionScheduleWeekRange(weekAnchorIso: string) {
  const { from: start } = sheetPeriodBounds('week', weekAnchorIso);
  const end = addDays(start, 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    days,
    weekStartIso: format(start, 'yyyy-MM-dd'),
  };
}

export function normalizeProductionScheduleWeekAnchor(iso: string): string {
  return format(productionScheduleWeekStart(parseISO(iso)), 'yyyy-MM-dd');
}

export function productionScheduleTodayWeekAnchor(): string {
  return format(productionScheduleWeekStart(new Date()), 'yyyy-MM-dd');
}
