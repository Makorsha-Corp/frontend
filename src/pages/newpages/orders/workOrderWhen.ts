import { parseLocalDateValue } from '@/components/newcomponents/customui/DateTimePickerField';
import { pad2 } from '@/components/newcomponents/customui/timePicker/timePickerShared';
import { untimedDayBounds } from '@/pages/newpages/orders/workOrderWindow';

export function workWhenDate(value: string): string {
  return parseLocalDateValue(value)?.dateIso ?? value.slice(0, 10);
}

export function workWhenClock(value: string): string | null {
  const parsed = parseLocalDateValue(value);
  if (parsed?.hour24 == null || parsed?.minute == null) return null;
  return `${pad2(parsed.hour24)}:${pad2(parsed.minute)}`;
}

export function mergeWorkWhenDate(prev: string, dateIso: string): string {
  const clock = workWhenClock(prev);
  return clock ? `${dateIso}T${clock}` : dateIso;
}

export function utcInstantToWorkWhen(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  const dateIso = `${read('year')}-${read('month')}-${read('day')}`;
  return `${dateIso}T${read('hour')}:${read('minute')}`;
}

export function durationMinutesFromWindow(
  startIso: string,
  endIso: string,
  plannedDate: string,
  timeZone: string,
): string {
  const end = new Date(endIso);
  const dayEnd = untimedDayBounds(plannedDate, timeZone).end;
  if (Math.abs(end.getTime() - dayEnd.getTime()) < 60_000) return '';
  const mins = Math.round((end.getTime() - new Date(startIso).getTime()) / 60_000);
  return mins > 0 ? String(mins) : '';
}

export function workWhenStateFromPlanned(
  plannedDate: string | null | undefined,
  plannedStartAt: string | null | undefined,
  plannedEndAt: string | null | undefined,
  timeZone: string,
): { workWhen: string; durationMinutes: string } {
  const dateIso = plannedDate?.trim().slice(0, 10) ?? '';
  if (plannedStartAt) {
    const workWhen = utcInstantToWorkWhen(plannedStartAt, timeZone);
    const dateForWindow = dateIso || workWhenDate(workWhen);
    return {
      workWhen,
      durationMinutes: plannedEndAt
        ? durationMinutesFromWindow(plannedStartAt, plannedEndAt, dateForWindow, timeZone)
        : '',
    };
  }
  return { workWhen: dateIso, durationMinutes: '' };
}

export function workWhenTimingSignature(workWhen: string, durationMinutes: string): string {
  return `${workWhen}|${durationMinutes}`;
}

export function workWhenToUpdatePayload(
  workWhen: string,
  durationMinutes: string,
): {
  planned_date: string;
  shift_id?: null;
  planned_start_time?: string | null;
  expected_duration_minutes?: number | null;
} {
  const planned_date = workWhenDate(workWhen);
  const workClock = workWhenClock(workWhen);
  if (!workClock) {
    return { planned_date };
  }
  return {
    planned_date,
    shift_id: null,
    planned_start_time: workClock,
    expected_duration_minutes: durationMinutes.trim() ? Number(durationMinutes) : null,
  };
}
