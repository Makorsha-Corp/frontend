import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isSameWeek,
  lastDayOfMonth,
  parseISO,
  set,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import type { CalendarEvent, CalendarView } from '@/types/calendar';

/** Sunday-start week to match work-order calendar. */
export const CALENDAR_WEEK_STARTS_ON = 0 as const;

export interface CalendarDateRange {
  start: string;
  end: string;
}

export interface CalendarDayCell {
  date: string;
  dateObj: Date;
  dayLabel: string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function parseCalendarDate(value: string): Date {
  return parseISO(value);
}

export function formatCalendarDate(value: Date | string): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'yyyy-MM-dd');
}

export function getVisibleRange(view: CalendarView, anchorDate: string): CalendarDateRange {
  const anchor = parseCalendarDate(anchorDate);

  if (view === 'month') {
    const from = startOfWeek(startOfMonth(anchor), { weekStartsOn: CALENDAR_WEEK_STARTS_ON });
    const to = endOfWeek(endOfMonth(anchor), { weekStartsOn: CALENDAR_WEEK_STARTS_ON });
    return { start: formatCalendarDate(from), end: formatCalendarDate(to) };
  }

  if (view === 'week') {
    const from = startOfWeek(anchor, { weekStartsOn: CALENDAR_WEEK_STARTS_ON });
    const to = endOfWeek(anchor, { weekStartsOn: CALENDAR_WEEK_STARTS_ON });
    return { start: formatCalendarDate(from), end: formatCalendarDate(to) };
  }

  if (view === 'day') {
    return { start: anchorDate, end: anchorDate };
  }

  // agenda: 30-day window from anchor
  const from = anchor;
  const to = addDays(anchor, 29);
  return { start: formatCalendarDate(from), end: formatCalendarDate(to) };
}

export function isViewingCurrentPeriod(view: CalendarView, anchorDate: string): boolean {
  const anchor = parseCalendarDate(anchorDate);
  const now = new Date();
  if (view === 'month') return isSameMonth(anchor, now);
  if (view === 'week') return isSameWeek(anchor, now, { weekStartsOn: CALENDAR_WEEK_STARTS_ON });
  if (view === 'day') return isSameDay(anchor, now);
  return isSameDay(anchor, now);
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index),
  label: format(new Date(2024, index, 1), 'MMMM'),
}));

export function getMonthSelectOptions() {
  return MONTH_OPTIONS;
}

export function getYearSelectOptions(anchorDate: string, span = 10): number[] {
  const centerYear = getYear(parseCalendarDate(anchorDate));
  const years: number[] = [];
  for (let year = centerYear - span; year <= centerYear + span; year += 1) {
    years.push(year);
  }
  return years;
}

/** Keep day-of-month when possible; clamp to last day of target month. */
export function setAnchorMonthYear(anchorDate: string, month: number, year: number): string {
  const current = parseCalendarDate(anchorDate);
  const day = getDate(current);
  const maxDay = getDate(lastDayOfMonth(new Date(year, month, 1)));
  const next = set(current, { year, month, date: Math.min(day, maxDay) });
  return formatCalendarDate(next);
}

export function getAnchorMonth(anchorDate: string): number {
  return getMonth(parseCalendarDate(anchorDate));
}

export function getAnchorYear(anchorDate: string): number {
  return getYear(parseCalendarDate(anchorDate));
}

export function shiftAnchorDate(view: CalendarView, anchorDate: string, direction: -1 | 1): string {
  const anchor = parseCalendarDate(anchorDate);
  if (view === 'month') {
    return formatCalendarDate(direction === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1));
  }
  if (view === 'week') {
    return formatCalendarDate(direction === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1));
  }
  if (view === 'day') {
    return formatCalendarDate(addDays(anchor, direction));
  }
  return formatCalendarDate(addDays(anchor, direction * 7));
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return map;
}

export function buildMonthGrid(
  anchorDate: string,
  selectedDate: string,
  eventsByDate: Map<string, CalendarEvent[]>,
): CalendarDayCell[] {
  const anchor = parseCalendarDate(anchorDate);
  const range = getVisibleRange('month', anchorDate);
  const today = todayIso();
  const monthStart = startOfMonth(anchor);

  return eachDayOfInterval({
    start: parseCalendarDate(range.start),
    end: parseCalendarDate(range.end),
  }).map((dateObj) => {
    const date = formatCalendarDate(dateObj);
    return {
      date,
      dateObj,
      dayLabel: format(dateObj, 'd'),
      isToday: date === today,
      isSelected: date === selectedDate,
      isCurrentMonth: isSameMonth(dateObj, monthStart),
      events: eventsByDate.get(date) ?? [],
    };
  });
}

export function buildWeekDays(
  anchorDate: string,
  selectedDate: string,
  eventsByDate: Map<string, CalendarEvent[]>,
): CalendarDayCell[] {
  const range = getVisibleRange('week', anchorDate);
  const today = todayIso();
  const anchor = parseCalendarDate(anchorDate);

  return eachDayOfInterval({
    start: parseCalendarDate(range.start),
    end: parseCalendarDate(range.end),
  }).map((dateObj) => {
    const date = formatCalendarDate(dateObj);
    return {
      date,
      dateObj,
      dayLabel: format(dateObj, 'EEE d'),
      isToday: date === today,
      isSelected: date === selectedDate,
      isCurrentMonth: isSameMonth(dateObj, anchor),
      events: eventsByDate.get(date) ?? [],
    };
  });
}

export function buildDayCell(
  anchorDate: string,
  eventsByDate: Map<string, CalendarEvent[]>,
): CalendarDayCell {
  const dateObj = parseCalendarDate(anchorDate);
  const today = todayIso();
  return {
    date: anchorDate,
    dateObj,
    dayLabel: format(dateObj, 'EEEE, MMMM d'),
    isToday: anchorDate === today,
    isSelected: true,
    isCurrentMonth: true,
    events: eventsByDate.get(anchorDate) ?? [],
  };
}

export interface AgendaGroup {
  date: string;
  dateLabel: string;
  events: CalendarEvent[];
}

export function buildAgendaGroups(
  anchorDate: string,
  eventsByDate: Map<string, CalendarEvent[]>,
): AgendaGroup[] {
  const range = getVisibleRange('agenda', anchorDate);
  const days = eachDayOfInterval({
    start: parseCalendarDate(range.start),
    end: parseCalendarDate(range.end),
  });

  return days
    .map((dateObj) => {
      const date = formatCalendarDate(dateObj);
      const events = eventsByDate.get(date) ?? [];
      if (events.length === 0) return null;
      return {
        date,
        dateLabel: format(dateObj, 'EEEE, MMM d, yyyy'),
        events,
      };
    })
    .filter((group): group is AgendaGroup => group !== null);
}

export function isSameCalendarDay(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b));
}
