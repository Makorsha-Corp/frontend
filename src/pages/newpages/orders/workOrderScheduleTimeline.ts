import { format, parseISO, startOfDay } from 'date-fns';

import type { WorkOrder, WorkOrderEvent } from '@/types/workOrder';
import { parseApiDateTime } from '@/utils/datetime';

import { formatWorkOrderVarianceVsPlanned, getWorkOrderCalendarDateString } from './workOrderDateUtils';

export type WorkOrderScheduleMilestoneTone = 'neutral' | 'on_time' | 'early' | 'late' | 'missing';

const SCHEDULE_CHANGE_FIELDS = new Set(['planned_date', 'end_date']);
const NOISY_EVENT_TYPES = new Set(['updated']);

/** WorkOrderEvent plus synthetic/promoted entries whose ids are strings. */
type ScheduleTimelineEvent = Omit<WorkOrderEvent, 'id'> & { id: number | string };

export interface WorkOrderEventLogEntry {
  id: string | number;
  event_type: string;
  description: string;
  created_at: string;
  performer_name?: string | null;
  metadata?: WorkOrderEvent['metadata'];
  scheduleDetails: string[];
}

function formatScheduleDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const raw = parseApiDateTime(value);
  if (!raw || Number.isNaN(raw.getTime())) return null;
  return format(startOfDay(raw), 'MMM d, yyyy');
}

function formatScheduleDateFromIso(value: string | null | undefined): string {
  return formatScheduleDate(value) ?? value ?? '—';
}

function plannedDayFromOrder(order: WorkOrder): Date | null {
  const raw = order.planned_date?.trim() || getWorkOrderCalendarDateString(order);
  if (!raw) return null;
  try {
    return startOfDay(parseISO(raw.slice(0, 10)));
  } catch {
    return null;
  }
}

function varianceLines(
  plannedDay: Date | null,
  actualAt: string | null | undefined,
  actualLabel: string,
): string[] {
  if (!actualAt?.trim()) return [];
  const actualFormatted = formatScheduleDate(actualAt);
  if (!actualFormatted) return [];
  const actualRaw = parseApiDateTime(actualAt);
  let actualLine = `${actualLabel}: ${actualFormatted}`;
  if (plannedDay && actualRaw) {
    const { text } = formatWorkOrderVarianceVsPlanned(plannedDay, startOfDay(actualRaw));
    actualLine = `${actualLine} · ${text}`;
  }
  return [actualLine];
}

function scheduleDetailsFromMetadata(
  eventType: string,
  metadata: WorkOrderEvent['metadata'],
): string[] {
  if (!metadata) return [];
  const lines: string[] = [];
  const varianceLabel = metadata.variance_label as string | undefined;
  if (eventType === 'scheduled') {
    const endDate = metadata.end_date as string | undefined;
    if (endDate?.trim()) {
      lines.push(`End date: ${formatScheduleDateFromIso(endDate)}`);
    }
  }
  if (eventType === 'schedule_updated') {
    const field = (metadata.field as string | undefined) ?? 'planned_date';
    const label = field === 'end_date' ? 'End date' : 'Planned start';
    const fromValue = metadata.from_value as string | undefined;
    const toValue = metadata.to_value as string | undefined;
    if (fromValue != null || toValue != null) {
      lines.push(`${label}: ${fromValue ?? '—'} → ${toValue ?? '—'}`);
    }
    return lines;
  }
  if (eventType === 'started' || eventType === 'completed') {
    const completionMode = metadata.completion_mode as string | undefined;
    if (completionMode === 'complete_as_planned') {
      return ['Logged retrospectively on planned date'];
    }
    const actualKey = eventType === 'started' ? 'started_at' : 'completed_at';
    const actual = metadata[actualKey] as string | undefined;
    const actualLabel = eventType === 'started' ? 'Actual start' : 'Completed';
    if (actual) {
      const actualLine = varianceLabel
        ? `${actualLabel}: ${formatScheduleDateFromIso(actual)} · ${varianceLabel}`
        : `${actualLabel}: ${formatScheduleDateFromIso(actual)}`;
      lines.push(actualLine);
    } else if (varianceLabel) {
      lines.push(varianceLabel);
    }
  }
  return lines;
}

function enrichEventEntry(
  order: WorkOrder,
  event: ScheduleTimelineEvent,
): WorkOrderEventLogEntry {
  const plannedDay = plannedDayFromOrder(order);
  let scheduleDetails = scheduleDetailsFromMetadata(event.event_type, event.metadata);

  if (scheduleDetails.length === 0) {
    if (event.event_type === 'started') {
      scheduleDetails = varianceLines(plannedDay, order.started_at, 'Actual start');
    } else if (event.event_type === 'completed') {
      scheduleDetails = varianceLines(plannedDay, order.completed_at, 'Completed');
    } else if (event.event_type === 'scheduled') {
      scheduleDetails = order.end_date?.trim()
        ? [`End date: ${formatScheduleDateFromIso(order.end_date)}`]
        : [];
    }
  }

  return {
    id: event.id,
    event_type: event.event_type,
    description: event.description,
    created_at: event.created_at,
    performer_name: event.user_name,
    metadata: event.metadata,
    scheduleDetails,
  };
}

function extractPromotedScheduleEvents(events: WorkOrderEvent[]): ScheduleTimelineEvent[] {
  const promoted: ScheduleTimelineEvent[] = [];
  for (const event of events) {
    if (event.event_type !== 'updated') continue;
    const changes = (event.metadata?.changes as Array<Record<string, string>> | undefined) ?? [];
    for (const change of changes) {
      if (!SCHEDULE_CHANGE_FIELDS.has(change.field)) continue;
      promoted.push({
        ...event,
        id: `${event.id}-schedule-${change.field}`,
        event_type: 'schedule_updated',
        description: `${change.label ?? 'Schedule'} changed`,
        metadata: {
          field: change.field,
          from_value: change.from_value,
          to_value: change.to_value,
          changes: [change],
        },
      });
    }
  }
  return promoted;
}

function dedupeScheduleEvents(events: ScheduleTimelineEvent[]): ScheduleTimelineEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (event.event_type !== 'schedule_updated') return true;
    const meta = event.metadata ?? {};
    const key = `${event.created_at}|${meta.field}|${meta.from_value}|${meta.to_value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function syntheticScheduledEvent(order: WorkOrder, events: WorkOrderEvent[]): ScheduleTimelineEvent | null {
  if (!order.planned_date?.trim()) return null;
  if (events.some((e) => e.event_type === 'scheduled')) return null;
  return {
    id: `synthetic-scheduled-${order.id}`,
    workspace_id: order.workspace_id,
    work_order_id: order.id,
    event_type: 'scheduled',
    description: `Planned for ${formatScheduleDateFromIso(order.planned_date)}`,
    metadata: { planned_date: order.planned_date.slice(0, 10) },
    performed_by: order.created_by,
    user_name: null,
    created_at: order.created_at,
  };
}

/** Event log feed with schedule context merged in (no separate summary card). */
export function buildWorkOrderEventLogEntries(
  order: WorkOrder,
  events: WorkOrderEvent[],
  options: { showUpdateEvents: boolean },
): WorkOrderEventLogEntry[] {
  const synthetic = syntheticScheduledEvent(order, events);
  const promoted = options.showUpdateEvents ? [] : extractPromotedScheduleEvents(events);

  const merged = dedupeScheduleEvents([
    ...events,
    ...promoted,
    ...(synthetic ? [synthetic] : []),
  ]);

  const filtered = options.showUpdateEvents
    ? merged
    : merged.filter((e) => !NOISY_EVENT_TYPES.has(e.event_type));

  return filtered
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((event) => enrichEventEntry(order, event));
}

/** @deprecated Use buildWorkOrderEventLogEntries — kept for tests. */
export function getWorkOrderEventScheduleHint(
  order: WorkOrder,
  eventType: string,
): string | null {
  const plannedDay = plannedDayFromOrder(order);
  if (!plannedDay) return null;
  if (eventType === 'started' && order.started_at) {
    const lines = varianceLines(plannedDay, order.started_at, 'Actual start');
    return lines[0] ?? null;
  }
  if (eventType === 'completed' && order.completed_at) {
    const lines = varianceLines(plannedDay, order.completed_at, 'Completed');
    return lines[0] ?? null;
  }
  return null;
}
