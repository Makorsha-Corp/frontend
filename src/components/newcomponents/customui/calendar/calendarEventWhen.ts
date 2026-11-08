import type { CalendarEvent } from '@/types/calendar';
import {
  formatScheduleInstant,
  formatWorkOrderCardWhen,
  scheduleInstantDateIso,
} from '@/pages/newpages/orders/workOrderCardWhen';

function calendarEventFieldKey(eventId: string): string | null {
  const parts = eventId.split(':');
  if (parts.length < 3) return null;
  return parts.slice(2).join(':');
}

/** Time line for week/day cards — matches work-order board when meta has schedule instants. */
export function formatCalendarEventWhen(
  event: CalendarEvent,
  timeZone: string,
  use24Hour: boolean,
): string | null {
  const meta = event.meta ?? {};

  if (event.source_type === 'work_order') {
    const plannedStart = meta.planned_start_at as string | undefined;
    const plannedEnd = meta.planned_end_at as string | undefined;
    if (!plannedStart) return null;

    const startDay = scheduleInstantDateIso(plannedStart, timeZone);
    const endDay = scheduleInstantDateIso(plannedEnd, timeZone);

    if (startDay === event.date) {
      const when = formatWorkOrderCardWhen(plannedStart, plannedEnd, timeZone, use24Hour);
      return when === 'Whole day' ? null : when;
    }

    if (plannedEnd && endDay === event.date && endDay !== startDay) {
      const endOnly = formatScheduleInstant(plannedEnd, timeZone, use24Hour);
      return endOnly ? `Until ${endOnly}` : null;
    }

    return null;
  }

  if (event.source_type === 'production_batch') {
    const fieldKey = calendarEventFieldKey(event.id);
    if (fieldKey === 'planned_start') {
      const iso = meta.planned_start_at as string | undefined;
      if (scheduleInstantDateIso(iso, timeZone) !== event.date) return null;
      return formatScheduleInstant(iso, timeZone, use24Hour);
    }
    if (fieldKey === 'actual_start') {
      const iso = meta.actual_start_time as string | undefined;
      if (scheduleInstantDateIso(iso, timeZone) !== event.date) return null;
      return formatScheduleInstant(iso, timeZone, use24Hour);
    }
  }

  return null;
}
