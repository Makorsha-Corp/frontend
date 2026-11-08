# Task 5 package

## src/components/newcomponents/customui/production/scheduleWeekBoard.ts

`
import { findShiftForDate } from '@/lib/workspaceShiftChipUtils';
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
  if (batchStatus === 'cancelled') return 'Cancelled';
  if (!stepStatus) return '';
  return STEP_STATUS_LABEL[stepStatus] ?? stepStatus;
}

`

## src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts

`
import { describe, expect, it } from 'vitest';
import type { ProductionScheduleBatch } from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';
import {
  scheduleStepCardText,
  scheduleStepStatusLabel,
  scheduleStepsForCell,
  scheduleStepsForDay,
} from './scheduleWeekBoard';

const morning: WorkspaceShift = {
  id: 1,
  workspace_id: 1,
  name: 'Morning',
  start_time: '06:00:00',
  end_time: '14:00:00',
  sort_order: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

const batch: ProductionScheduleBatch = {
  batch_id: 20,
  batch_number: 'BATCH-2026-020',
  status: 'draft',
  planned_start_at: '2026-10-25T06:00:00',
  planned_end_at: '2026-10-25T08:00:00',
  steps: [
    {
      stage_log_id: 1,
      stage_name: 'Carding & Ring Spinning Line 1',
      stage_order: 1,
      production_line_id: 10,
      machine_id: null,
      status: 'pending',
      planned_start_at: '2026-10-25T06:00:00',
      planned_end_at: '2026-10-25T07:00:00',
      rework_of_log_id: null,
    },
    {
      stage_log_id: 2,
      stage_name: 'Embroidery Line',
      stage_order: 2,
      production_line_id: 11,
      machine_id: null,
      status: 'pending',
      planned_start_at: '2026-10-25T07:00:00',
      planned_end_at: '2026-10-25T08:00:00',
      rework_of_log_id: null,
    },
  ],
};

describe('scheduleWeekBoard', () => {
  const day = new Date(2026, 9, 25);

  it('places each step on its own line', () => {
    const carding = scheduleStepsForCell([batch], 10, day);
    const embroidery = scheduleStepsForCell([batch], 11, day);
    expect(carding.map((row) => row.step.stage_log_id)).toEqual([1]);
    expect(embroidery.map((row) => row.step.stage_log_id)).toEqual([2]);
  });

  it('card text is time, shift, and batch number', () => {
    const text = scheduleStepCardText(batch.steps[0], batch.batch_number, [morning], true);
    expect(text.when).toBe('06:00 · Morning');
    expect(text.batchNumber).toBe('BATCH-2026-020');
    expect(text.when).not.toContain('Carding');
    expect(text.batchNumber).not.toContain('Embroidery');
  });

  it('day list keeps a step with no line', () => {
    const unassigned = {
      ...batch,
      steps: [{ ...batch.steps[0], production_line_id: null }],
    };
    expect(scheduleStepsForCell([unassigned], 10, day)).toEqual([]);
    expect(scheduleStepsForDay([unassigned], day)).toHaveLength(1);
  });

  it('draft batch status wins over pending step', () => {
    expect(scheduleStepStatusLabel('draft', 'pending')).toBe('Draft');
    expect(scheduleStepStatusLabel('in_progress', 'completed')).toBe('Done');
    expect(scheduleStepStatusLabel('cancelled', 'pending')).toBe('Cancelled');
  });
});

`
