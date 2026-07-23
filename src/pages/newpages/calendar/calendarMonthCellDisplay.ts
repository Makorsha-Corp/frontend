import type { CalendarEvent } from '@/types/calendar';
import {
  groupEventsByCategory,
  type CategoryEventGroup,
} from '@/pages/newpages/calendar/calendarDateUtils';

export interface MonthCellDisplayPlan {
  groups: CategoryEventGroup[];
  totalEventCount: number;
}

/** First two category rows for month cell body; width fit happens at render time. */
export function planMonthCellDisplay(events: CalendarEvent[]): MonthCellDisplayPlan {
  const allGroups = groupEventsByCategory(events);
  return {
    groups: allGroups.slice(0, 2),
    totalEventCount: events.length,
  };
}

/** Split chipSlots across two categories; min 1 each when both have events and budget allows. */
export function allocateChipSlotsTwoCategories(
  chipSlots: number,
  count0: number,
  count1: number,
): [n0: number, n1: number] {
  if (chipSlots <= 0) return [0, 0];
  if (count1 === 0) return [Math.min(count0, chipSlots), 0];
  if (count0 === 0) return [0, Math.min(count1, chipSlots)];

  if (chipSlots === 1) return [1, 0];

  let n0 = 1;
  let n1 = 1;
  const remaining = chipSlots - 2;
  const total = count0 + count1;
  const extra0 = Math.floor((remaining * count0) / total);
  n0 = Math.min(count0, 1 + extra0);
  n1 = Math.min(count1, chipSlots - n0);

  if (n0 + n1 < chipSlots) {
    n0 = Math.min(count0, chipSlots - n1);
  }

  if (n1 < 1 && count1 > 0) {
    n1 = 1;
    n0 = Math.min(count0, chipSlots - 1);
  }

  return [n0, n1];
}
