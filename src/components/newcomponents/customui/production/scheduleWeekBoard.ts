import { format } from 'date-fns';
import {
  findShiftForDate,
  minutesInShiftWindow,
  parseTimeToMinutes,
} from '@/lib/workspaceShiftChipUtils';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import type { ProductionScheduleBatch, ProductionScheduleStep } from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';

export interface ScheduleWeekBoardRow {
  batch: ProductionScheduleBatch;
  step: ProductionScheduleStep;
}

const STEP_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Done',
  skipped: 'Skipped',
};

function sameLocalCalendarDay(plannedStartAt: string, day: Date): boolean {
  const when = new Date(plannedStartAt);
  return (
    when.getFullYear() === day.getFullYear() &&
    when.getMonth() === day.getMonth() &&
    when.getDate() === day.getDate()
  );
}

function byPlannedStartThenBatch(a: ScheduleWeekBoardRow, b: ScheduleWeekBoardRow): number {
  const startDelta =
    new Date(a.step.planned_start_at).getTime() - new Date(b.step.planned_start_at).getTime();
  if (startDelta !== 0) return startDelta;
  return a.batch.batch_number.localeCompare(b.batch.batch_number);
}

function rowsOnDay(batches: ProductionScheduleBatch[], day: Date): ScheduleWeekBoardRow[] {
  const rows: ScheduleWeekBoardRow[] = [];
  for (const batch of batches) {
    for (const step of batch.steps) {
      if (!sameLocalCalendarDay(step.planned_start_at, day)) continue;
      rows.push({ batch, step });
    }
  }
  rows.sort(byPlannedStartThenBatch);
  return rows;
}

export function scheduleStepsForCell(
  batches: ProductionScheduleBatch[],
  lineId: number,
  day: Date,
): ScheduleWeekBoardRow[] {
  return rowsOnDay(batches, day).filter((row) => row.step.production_line_id === lineId);
}

export function localPlannedStartHour(plannedStartAt: string): number {
  return new Date(plannedStartAt).getHours();
}

function startOfLocalDay(day: Date): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDayExclusive(day: Date): Date {
  const d = startOfLocalDay(day);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Local `[planned_start_at, planned_end_at)`; zero-length end occupies the start hour only. */
export function stepPlannedInterval(step: ProductionScheduleStep): { start: Date; end: Date } {
  const start = new Date(step.planned_start_at);
  let end = new Date(step.planned_end_at);
  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export function stepOverlapsHourOnDay(
  step: ProductionScheduleStep,
  day: Date,
  hour: number,
): boolean {
  const { start, end } = stepPlannedInterval(step);
  const hourStart = new Date(day);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);
  return start < hourEnd && end > hourStart;
}

export function hoursOverlappedByStepOnDay(step: ProductionScheduleStep, day: Date): number[] {
  const { start, end } = stepPlannedInterval(step);
  const dayStart = startOfLocalDay(day);
  const dayEnd = endOfLocalDayExclusive(day);
  if (start >= dayEnd || end <= dayStart) return [];
  const hours: number[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    if (stepOverlapsHourOnDay(step, day, hour)) hours.push(hour);
  }
  return hours;
}

function stepMatchesLineFilter(step: ProductionScheduleStep, lineIds: number[]): boolean {
  if (lineIds.length === 0) return false;
  const lid = step.production_line_id;
  if (lid == null) return false;
  return lineIds.includes(lid);
}

/** Hours 0–23 with at least one minute inside an active shift window. Overnight shifts do not fill the gap. */
export function hoursCoveredByShift(shift: WorkspaceShift): number[] {
  if (!shift.is_active) return [];
  const start = parseTimeToMinutes(shift.start_time);
  const end = parseTimeToMinutes(shift.end_time);
  if (start === end) return [];
  const hours: number[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    if (minutesInShiftWindow(hour * 60, start, end)) hours.push(hour);
  }
  return hours;
}

export function scheduleStepsForHourCell(
  batches: ProductionScheduleBatch[],
  lineIds: number[],
  day: Date,
  hour: number,
): ScheduleWeekBoardRow[] {
  const rows: ScheduleWeekBoardRow[] = [];
  for (const batch of batches) {
    for (const step of batch.steps) {
      if (!stepMatchesLineFilter(step, lineIds)) continue;
      if (!stepOverlapsHourOnDay(step, day, hour)) continue;
      rows.push({ batch, step });
    }
  }
  rows.sort(byPlannedStartThenBatch);
  return rows;
}

/** Sorted hour rows for week hour grid across filtered lines; empty when nothing to show. */
export function buildScheduleWeekDisplayHours(
  shifts: WorkspaceShift[],
  batches: ProductionScheduleBatch[],
  lineIds: number[],
  weekDays: Date[],
): number[] {
  const hourSet = new Set<number>();
  for (const shift of shifts) {
    for (const hour of hoursCoveredByShift(shift)) hourSet.add(hour);
  }
  for (const day of weekDays) {
    for (const batch of batches) {
      for (const step of batch.steps) {
        if (!stepMatchesLineFilter(step, lineIds)) continue;
        for (const hour of hoursOverlappedByStepOnDay(step, day)) {
          hourSet.add(hour);
        }
      }
    }
  }
  if (hourSet.size === 0) return [];
  return [...hourSet].sort((a, b) => a - b);
}

export function formatScheduleWeekHourLabel(hour: number, use24Hour: boolean): string {
  const hm = `${String(hour).padStart(2, '0')}:00`;
  return formatWallTimeHm(hm, use24Hour);
}

export interface HourGridSpan {
  stageLogId: number;
  batch: ProductionScheduleBatch;
  step: ProductionScheduleStep;
  /** Inclusive index into `displayHours`. */
  startIndex: number;
  /** Exclusive index into `displayHours`. */
  endIndex: number;
}

function visibleHourIndicesForStepOnDay(
  step: ProductionScheduleStep,
  day: Date,
  displayHours: number[],
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < displayHours.length; i += 1) {
    const hour = displayHours[i];
    if (hour != null && stepOverlapsHourOnDay(step, day, hour)) indices.push(i);
  }
  return indices;
}

function spansOverlap(a: Pick<HourGridSpan, 'startIndex' | 'endIndex'>, b: Pick<HourGridSpan, 'startIndex' | 'endIndex'>): boolean {
  return a.startIndex < b.endIndex && a.endIndex > b.startIndex;
}

/** One span per step per day column on visible hour rows. */
export function hourGridSpansForDay(
  batches: ProductionScheduleBatch[],
  lineIds: number[],
  day: Date,
  displayHours: number[],
): HourGridSpan[] {
  if (displayHours.length === 0) return [];

  const spans: HourGridSpan[] = [];
  for (const batch of batches) {
    for (const step of batch.steps) {
      if (!stepMatchesLineFilter(step, lineIds)) continue;
      const indices = visibleHourIndicesForStepOnDay(step, day, displayHours);
      if (indices.length === 0) continue;
      spans.push({
        stageLogId: step.stage_log_id,
        batch,
        step,
        startIndex: Math.min(...indices),
        endIndex: Math.max(...indices) + 1,
      });
    }
  }

  spans.sort((a, b) => {
    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
    const lenA = a.endIndex - a.startIndex;
    const lenB = b.endIndex - b.startIndex;
    if (lenA !== lenB) return lenB - lenA;
    return a.stageLogId - b.stageLogId;
  });

  return spans;
}

/** Overlapping spans in one day column stack vertically (lines-view style). */
export function clusterHourGridSpans(spans: HourGridSpan[]): HourGridSpan[][] {
  if (spans.length === 0) return [];

  const parent = spans.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root]!;
    let cursor = index;
    while (parent[cursor] !== cursor) {
      const next = parent[cursor]!;
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      if (spansOverlap(spans[i]!, spans[j]!)) union(i, j);
    }
  }

  const groups = new Map<number, HourGridSpan[]>();
  spans.forEach((span, index) => {
    const root = find(index);
    const list = groups.get(root) ?? [];
    list.push(span);
    groups.set(root, list);
  });

  return [...groups.values()].map((group) =>
    group.sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      return a.stageLogId - b.stageLogId;
    }),
  );
}

/** Keeps only hour values that have at least one filtered step somewhere in the week. */
export function filterScheduledDisplayHours(
  displayHours: number[],
  batches: ProductionScheduleBatch[],
  lineIds: number[],
  weekDays: Date[],
): number[] {
  if (displayHours.length === 0) return [];
  const hourSet = new Set<number>();
  for (const day of weekDays) {
    for (const batch of batches) {
      for (const step of batch.steps) {
        if (!stepMatchesLineFilter(step, lineIds)) continue;
        for (const hour of hoursOverlappedByStepOnDay(step, day)) {
          if (displayHours.includes(hour)) hourSet.add(hour);
        }
      }
    }
  }
  return displayHours.filter((hour) => hourSet.has(hour));
}

export function scheduleStepsForDay(
  batches: ProductionScheduleBatch[],
  day: Date,
): ScheduleWeekBoardRow[] {
  return rowsOnDay(batches, day);
}

export function scheduleStepCardText(
  step: ProductionScheduleStep,
  batchNumber: string,
  shifts: WorkspaceShift[],
  use24Hour: boolean,
): { when: string; batchNumber: string } {
  const when = new Date(step.planned_start_at);
  const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
  const clock = formatWallTimeHm(hm, use24Hour);
  const shift = findShiftForDate(shifts, when);
  return {
    when: shift ? `${clock} · ${shift.name}` : clock,
    batchNumber,
  };
}

export function scheduleStepStatusLabel(batchStatus: string, stepStatus: string | undefined): string {
  if (batchStatus === 'draft') return 'Draft';
  if (batchStatus === 'recurring') return 'Recurring';
  if (batchStatus === 'cancelled') return 'Cancelled';
  if (!stepStatus) return '';
  return STEP_STATUS_LABEL[stepStatus] ?? stepStatus;
}

/** Batch-level pill on week board cards (batch status wins). */
export function scheduleBatchStatusPillLabel(batchStatus: string): string {
  if (batchStatus === 'draft') return 'Draft';
  if (batchStatus === 'recurring') return 'Rec';
  if (batchStatus === 'cancelled') return 'Cancelled';
  if (batchStatus === 'in_progress') return 'Running';
  if (batchStatus === 'completed') return 'Done';
  return batchStatus;
}

export function scheduleBatchStatusStripeClass(batchStatus: string): string {
  if (batchStatus === 'draft') return 'border-l-slate-400 dark:border-l-slate-500';
  if (batchStatus === 'recurring') return 'border-l-violet-400 dark:border-l-violet-500';
  if (batchStatus === 'in_progress') return 'border-l-amber-500';
  if (batchStatus === 'completed') return 'border-l-emerald-500';
  if (batchStatus === 'cancelled') return 'border-l-red-400 dark:border-l-red-500';
  return 'border-l-border';
}

export function scheduleBatchStatusPillClass(batchStatus: string): string {
  if (batchStatus === 'draft') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  if (batchStatus === 'recurring') return 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200';
  if (batchStatus === 'in_progress') return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
  if (batchStatus === 'completed') return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
  if (batchStatus === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
  return 'bg-muted text-muted-foreground';
}

export function countStepStartsByDay(
  batches: ProductionScheduleBatch[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const batch of batches) {
    for (const step of batch.steps) {
      const when = new Date(step.planned_start_at);
      const key = format(when, 'yyyy-MM-dd');
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export const SCHEDULE_WEEK_CELL_VISIBLE_CARDS = 2;
