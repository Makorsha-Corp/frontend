import type { ProductionBatchEvent } from '@/types/production';

import {
  BATCH_EVENT_FILTER_ALL,
  batchEventMatchesFilter,
  type BatchEventLogFilter,
} from './batchEventLogFilters';

/** Step “actuals” merged into one session card when within the window. */
export const BATCH_EVENT_STEP_UPDATE_TYPES = new Set([
  'item_actual_changed',
  'item_expected_changed',
  'condition_actual_changed',
  'step_output_changed',
  'step_input_changed',
  'step_waste_changed',
  'step_line_changed',
  'step_machine_changed',
  'step_minutes_changed',
]);

export const BATCH_EVENT_STEP_UPDATE_SESSION_MS = 10 * 60 * 1000;

export type BatchEventLogSingle = { kind: 'single'; event: ProductionBatchEvent; anchorAt: string };

export type BatchEventLogGroup = {
  kind: 'group';
  events: ProductionBatchEvent[];
  batchStageLogId: number;
  anchorAt: string;
};

export type BatchEventLogEntry = BatchEventLogSingle | BatchEventLogGroup;

function eventTimeMs(event: ProductionBatchEvent): number | null {
  const t = new Date(event.created_at).getTime();
  return Number.isNaN(t) ? null : t;
}

export function isStepUpdateBucketEvent(event: ProductionBatchEvent): boolean {
  if (!BATCH_EVENT_STEP_UPDATE_TYPES.has(event.event_type)) return false;
  if (event.batch_stage_log_id == null) return false;
  return eventTimeMs(event) != null;
}

/** Transitive 10-minute sessions on one step log (sorted input ascending). */
export function clusterStepUpdateSessions(
  events: ProductionBatchEvent[],
  windowMs: number = BATCH_EVENT_STEP_UPDATE_SESSION_MS,
): ProductionBatchEvent[][] {
  if (events.length === 0) return [];
  const sorted = [...events].sort(
    (a, b) => (eventTimeMs(a) ?? 0) - (eventTimeMs(b) ?? 0),
  );
  const sessions: ProductionBatchEvent[][] = [];
  let current: ProductionBatchEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const e = sorted[i];
    const t = eventTimeMs(e)!;
    const inSession = current.some((c) => {
      const ct = eventTimeMs(c)!;
      return Math.abs(t - ct) <= windowMs;
    });
    if (inSession) {
      current.push(e);
    } else {
      sessions.push(current);
      current = [e];
    }
  }
  sessions.push(current);
  return sessions;
}

function newestCreatedAt(events: ProductionBatchEvent[]): string {
  let best = events[0];
  for (const e of events) {
    if ((eventTimeMs(e) ?? 0) >= (eventTimeMs(best) ?? 0)) best = e;
  }
  return best.created_at;
}

function anchorMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sessionPassesFilter(
  session: ProductionBatchEvent[],
  filter: BatchEventLogFilter,
): boolean {
  if (filter === BATCH_EVENT_FILTER_ALL) return true;
  return session.some((e) => batchEventMatchesFilter(e, filter));
}

/**
 * Build timeline units: session groups (≥2 bucket events), singles otherwise.
 * Filter: include a session if any member matches; show all sub-lines in included sessions.
 */
export function buildBatchEventTimeline(
  events: ProductionBatchEvent[],
  filter: BatchEventLogFilter = BATCH_EVENT_FILTER_ALL,
): BatchEventLogEntry[] {
  const bucketByStep = new Map<number, ProductionBatchEvent[]>();
  const nonBucket: ProductionBatchEvent[] = [];

  for (const event of events) {
    if (isStepUpdateBucketEvent(event)) {
      const stepId = event.batch_stage_log_id!;
      const list = bucketByStep.get(stepId) ?? [];
      list.push(event);
      bucketByStep.set(stepId, list);
    } else {
      nonBucket.push(event);
    }
  }

  const units: BatchEventLogEntry[] = [];

  for (const [, stepEvents] of bucketByStep) {
    const sessions = clusterStepUpdateSessions(stepEvents);
    for (const session of sessions) {
      if (!sessionPassesFilter(session, filter)) continue;

      if (session.length >= 2) {
        const sortedNewestFirst = [...session].sort(
          (a, b) => (eventTimeMs(b) ?? 0) - (eventTimeMs(a) ?? 0),
        );
        units.push({
          kind: 'group',
          events: sortedNewestFirst,
          batchStageLogId: session[0].batch_stage_log_id!,
          anchorAt: newestCreatedAt(session),
        });
      } else {
        const e = session[0];
        if (filter === BATCH_EVENT_FILTER_ALL || batchEventMatchesFilter(e, filter)) {
          units.push({ kind: 'single', event: e, anchorAt: e.created_at });
        }
      }
    }
  }

  for (const event of nonBucket) {
    if (filter !== BATCH_EVENT_FILTER_ALL && !batchEventMatchesFilter(event, filter)) {
      continue;
    }
    units.push({ kind: 'single', event, anchorAt: event.created_at });
  }

  units.sort((a, b) => anchorMs(b.anchorAt) - anchorMs(a.anchorAt));

  return units;
}

/** @deprecated Use buildBatchEventTimeline */
export function groupBatchEventsForDisplay(events: ProductionBatchEvent[]): BatchEventLogEntry[] {
  return buildBatchEventTimeline(events, BATCH_EVENT_FILTER_ALL);
}

export function buildBatchEventGroupTitle(events: ProductionBatchEvent[]): string {
  const stage = resolveStageNameFromEvents(events);
  return stage ? `${stage} updated` : 'Updated';
}

export function resolveStageNameFromEvents(events: ProductionBatchEvent[]): string | null {
  for (const event of events) {
    const meta = event.metadata;
    if (meta && typeof meta === 'object' && typeof meta.stage_name === 'string' && meta.stage_name.trim()) {
      return meta.stage_name;
    }
  }
  const logId = events[0]?.batch_stage_log_id;
  return logId != null ? `Step #${logId}` : null;
}
