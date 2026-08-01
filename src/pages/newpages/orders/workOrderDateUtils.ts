import { differenceInCalendarDays, format, isSameDay, parseISO, startOfDay } from 'date-fns';

import type { WorkOrder } from '@/types/workOrder';

import { parseApiDateTime } from '@/utils/datetime';



type WorkOrderDateFields = Pick<

  WorkOrder,

  'calendar_date' | 'planned_date' | 'created_at' | 'started_at' | 'completed_at'

>;



/** yyyy-MM-dd — API calendar_date when present, else planned_date or created_at day. */

export function getWorkOrderCalendarDateString(order: WorkOrderDateFields): string {

  if (order.calendar_date) {

    return order.calendar_date.slice(0, 10);

  }

  if (order.planned_date?.trim()) {

    return order.planned_date.slice(0, 10);

  }

  return format(startOfDay(parseISO(order.created_at)), 'yyyy-MM-dd');

}



export function getWorkOrderCalendarDate(order: WorkOrderDateFields): Date {

  return startOfDay(parseISO(getWorkOrderCalendarDateString(order)));

}



export type WorkOrderLifecycleNoteTone = 'started' | 'completed' | 'both';



export interface WorkOrderLifecycleNote {

  text: string;

  tone: WorkOrderLifecycleNoteTone;

}



export interface WorkOrderStartColumnLines {

  /** Display date for sheet column (started day or planned). */

  scheduled: string;

  lifecycleNotes: WorkOrderLifecycleNote[];

}



function relativeDayLabel(delta: number): string {

  const absN = Math.abs(delta);

  const unit = absN === 1 ? 'day' : 'days';

  const dir = delta < 0 ? 'early' : 'late';

  return `${absN} ${unit} ${dir}`;

}

/**
 * When false, sheet hides start vs plan early/late/overdue UI until duration-aware rules exist.
 * Re-enable when expected duration or due-date lateness is defined.
 */
export const WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED = false;

/** Factual lifecycle lines only — no early/late/on-plan relative wording. */
export function buildNeutralLifecycleNotes(
  startedDay: Date | null,
  completedDay: Date | null,
): WorkOrderLifecycleNote[] {
  if (startedDay && completedDay && isSameDay(startedDay, completedDay)) {
    return [
      {
        tone: 'both',
        text: `Started & completed ${format(startedDay, 'MMM d')}`,
      },
    ];
  }

  const notes: WorkOrderLifecycleNote[] = [];

  if (startedDay) {
    notes.push({
      tone: 'started',
      text: `Started ${format(startedDay, 'MMM d')}`,
    });
  }

  if (completedDay && (!startedDay || !isSameDay(startedDay, completedDay))) {
    notes.push({
      tone: 'completed',
      text: `Completed ${format(completedDay, 'MMM d')}`,
    });
  }

  return notes;
}

/** Calendar-day delta vs planned day — for schedule summary and event hints. */
export function formatWorkOrderVarianceVsPlanned(
  plannedDay: Date,
  actualDay: Date,
): { text: string; tone: 'on_time' | 'early' | 'late' } {
  const delta = differenceInCalendarDays(actualDay, plannedDay);
  if (delta === 0) return { text: 'On plan', tone: 'on_time' };
  return { text: relativeDayLabel(delta), tone: delta < 0 ? 'early' : 'late' };
}



function buildLifecycleNotes(

  primaryDate: Date,

  startedDay: Date | null,

  completedDay: Date | null,

): WorkOrderLifecycleNote[] {

  const startedDelta =

    startedDay != null ? differenceInCalendarDays(startedDay, primaryDate) : null;

  const completedDelta =

    completedDay != null ? differenceInCalendarDays(completedDay, primaryDate) : null;



  if (

    startedDay &&

    completedDay &&

    isSameDay(startedDay, completedDay) &&

    startedDelta !== 0 &&

    startedDelta === completedDelta

  ) {

    return [

      {

        tone: 'both',

        text: `Started & completed ${format(startedDay, 'MMM d')} · ${relativeDayLabel(startedDelta)}`,

      },

    ];

  }



  const notes: WorkOrderLifecycleNote[] = [];



  if (startedDay && startedDelta !== 0) {

    notes.push({

      tone: 'started',

      text: `Started ${format(startedDay, 'MMM d')} · ${relativeDayLabel(startedDelta)}`,

    });

  } else if (startedDay && startedDelta === 0 && !completedDay) {

    notes.push({

      tone: 'started',

      text: `Started ${format(startedDay, 'MMM d')} · On plan`,

    });

  }



  if (completedDay && completedDelta !== 0) {

    notes.push({

      tone: 'completed',

      text: `Completed ${format(completedDay, 'MMM d')} · ${relativeDayLabel(completedDelta)}`,

    });

  }



  return notes;

}



function lifecycleDaysFromRow(row: {

  startedAt: string | null;

  completedAt: string | null;

}): { startedDay: Date | null; completedDay: Date | null } {

  const startedRaw = row.startedAt ? parseApiDateTime(row.startedAt) : null;

  const completedRaw = row.completedAt ? parseApiDateTime(row.completedAt) : null;

  return {

    startedDay: startedRaw ? startOfDay(startedRaw) : null,

    completedDay: completedRaw ? startOfDay(completedRaw) : null,

  };

}



/** Planned day baseline for variance (explicit planned_date or calendar fallback). */

export function getWorkOrderPlannedDay(row: {

  plannedDate: string | null;

  calendarDate: string;

}): Date {

  const raw = row.plannedDate?.trim() || row.calendarDate;

  return startOfDay(parseISO(raw));

}



/**
 * List-view Start column label: always the planned work day.
 * Actual start/completion vs plan is shown in the popover and badge colors.
 */
export function getWorkOrderSheetDisplayDate(row: {
  plannedDate: string | null;
  calendarDate: string;
}): string {
  const fallback = row.plannedDate?.trim() || row.calendarDate;
  return format(startOfDay(parseISO(fallback)), 'MMM d');
}

export type WorkOrderRetrospectiveLogRow = WorkOrderSheetDateRow & {
  updatedAt?: string | null;
};

/**
 * Backfilled completion (Complete as planned): stamped on the planned day but saved later.
 * Uses updated_at vs planned/completed days, with same-instant start+complete as fallback.
 */
export function isWorkOrderLoggedRetrospectively(row: WorkOrderRetrospectiveLogRow): boolean {
  if (!row.completedAt?.trim()) return false;

  const plannedDay = getWorkOrderPlannedDay(row);
  const completedRaw = parseApiDateTime(row.completedAt);
  if (!completedRaw) return false;
  const completedDay = startOfDay(completedRaw);

  const updatedRaw = row.updatedAt?.trim() ? parseApiDateTime(row.updatedAt) : null;
  const updatedDay = updatedRaw ? startOfDay(updatedRaw) : null;

  if (
    updatedDay &&
    !isSameDay(updatedDay, plannedDay) &&
    (isSameDay(completedDay, plannedDay) || completedDay < plannedDay)
  ) {
    return true;
  }

  if (!row.startedAt?.trim()) return false;
  const startedRaw = parseApiDateTime(row.startedAt);
  if (!startedRaw) return false;

  return (
    startedRaw.getTime() === completedRaw.getTime() &&
    isSameDay(completedDay, plannedDay)
  );
}

/** Popover detail under "Logged later" headline. */
export function getWorkOrderLoggedLaterDetail(row: WorkOrderRetrospectiveLogRow): string | null {
  if (!isWorkOrderLoggedRetrospectively(row)) return null;
  const updatedRaw = row.updatedAt?.trim() ? parseApiDateTime(row.updatedAt) : null;
  if (updatedRaw) {
    return `Stamped on planned date · logged ${format(startOfDay(updatedRaw), 'MMM d, yyyy')}`;
  }
  return 'Stamped on planned date';
}



export type WorkOrderSheetDateRow = {
  plannedDate: string | null;
  calendarDate: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type WorkOrderSheetAttentionKind =
  | 'none'
  | 'overdue_not_started'
  | 'overdue_in_progress'
  | 'lifecycle_variance'
  | 'completed';

export interface WorkOrderSheetDateAttention {
  kind: WorkOrderSheetAttentionKind;
  ariaLabel: string;
  overdueHeadline: string | null;
  varianceHeadline: string | null;
  /** Backfilled via Complete as planned — shown in date popover only. */
  loggedLaterHeadline: string | null;
  /** Start vs plan only — drives open-work cell badge color; null when no badge. */
  startVarianceTone: 'early' | 'late' | null;
  popoverLines: WorkOrderDatePopoverLines | null;
}

function isWorkOrderOverdue(
  row: Pick<WorkOrderSheetDateRow, 'plannedDate'>,
  referenceDate: Date
): boolean {
  const plannedDateStr = row.plannedDate?.trim();
  if (!plannedDateStr) return false;
  return startOfDay(parseISO(plannedDateStr)) < referenceDate;
}

/** Headline for popover / aria when actual start differs from plan. */
export function getWorkOrderStartVarianceHeadline(row: WorkOrderSheetDateRow): string | null {
  const tone = getWorkOrderStartVarianceTone(row);
  if (tone === 'early') return 'Started early';
  if (tone === 'late') return 'Started late';
  return null;
}

export type WorkOrderStartVarianceTone = 'early' | 'late' | 'on_time' | 'not_started';

/** Compare started_at calendar day vs planned day — for Start column badge only. */
export function getWorkOrderStartVarianceTone(row: WorkOrderSheetDateRow): WorkOrderStartVarianceTone {
  const { startedDay } = lifecycleDaysFromRow(row);
  if (!startedDay) return 'not_started';
  const plannedDay = getWorkOrderPlannedDay(row);
  const { tone } = formatWorkOrderVarianceVsPlanned(plannedDay, startedDay);
  if (tone === 'early') return 'early';
  if (tone === 'late') return 'late';
  return 'on_time';
}

export function hasWorkOrderStartVariance(row: WorkOrderSheetDateRow): boolean {
  const tone = getWorkOrderStartVarianceTone(row);
  return tone === 'early' || tone === 'late';
}

function startVarianceToneForBadge(row: WorkOrderSheetDateRow): 'early' | 'late' | null {
  const tone = getWorkOrderStartVarianceTone(row);
  return tone === 'early' || tone === 'late' ? tone : null;
}

function lifecycleVarianceAriaLabel(row: WorkOrderSheetDateRow): string {
  const headline = getWorkOrderStartVarianceHeadline(row);
  if (!headline) return 'View start timeline';
  const { startedDay } = lifecycleDaysFromRow(row);
  const plannedDay = getWorkOrderPlannedDay(row);
  if (!startedDay) return headline;
  const { text } = formatWorkOrderVarianceVsPlanned(plannedDay, startedDay);
  return `${headline} — ${text} vs plan`;
}

function getWorkOrderSheetDateAttentionWithoutVariance(
  row: WorkOrderSheetDateRow & { status: string },
  popoverLines: WorkOrderDatePopoverLines,
): WorkOrderSheetDateAttention {
  if (row.status === 'COMPLETED') {
    return {
      kind: 'completed',
      ariaLabel: 'Completed — view planned and start dates',
      overdueHeadline: null,
      varianceHeadline: null,
      loggedLaterHeadline: null,
      startVarianceTone: null,
      popoverLines,
    };
  }

  return {
    kind: 'none',
    ariaLabel: 'View planned and start dates',
    overdueHeadline: null,
    varianceHeadline: null,
    loggedLaterHeadline: null,
    startVarianceTone: null,
    popoverLines,
  };
}

/** Sheet Date column attention: overdue (open) vs planned/actual lifecycle variance. */
export function getWorkOrderSheetDateAttention(
  row: WorkOrderSheetDateRow & { status: string; updatedAt?: string | null },
  referenceDate: Date = startOfDay(new Date())
): WorkOrderSheetDateAttention {
  const popoverLines = formatWorkOrderDatePopoverLines(row);

  if (!WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED) {
    return getWorkOrderSheetDateAttentionWithoutVariance(row, popoverLines);
  }

  const varianceHeadline = getWorkOrderStartVarianceHeadline(row);
  const startVarianceTone = startVarianceToneForBadge(row);
  const loggedLater = isWorkOrderLoggedRetrospectively(row);

  if (row.status === 'COMPLETED') {
    return {
      kind: 'completed',
      ariaLabel: loggedLater
        ? 'Logged later — view planned and completion dates'
        : varianceHeadline
          ? lifecycleVarianceAriaLabel(row)
          : 'Completed — view planned and start dates',
      overdueHeadline: null,
      varianceHeadline,
      loggedLaterHeadline: loggedLater ? 'Logged later' : null,
      startVarianceTone,
      popoverLines,
    };
  }

  if (row.status === 'IN_PROGRESS' && isWorkOrderOverdue(row, referenceDate)) {
    const hasStartedNote = popoverLines.lifecycleNotes.some(
      (note) => note.tone === 'started' || note.tone === 'both',
    );
    const startedRaw = parseApiDateTime(row.startedAt);
    const lifecycleNotes =
      hasStartedNote || !startedRaw
        ? popoverLines.lifecycleNotes
        : [
            {
              tone: 'started' as const,
              text: `Started ${format(startOfDay(startedRaw), 'MMM d')}`,
            },
            ...popoverLines.lifecycleNotes,
          ];
    return {
      kind: 'overdue_in_progress',
      ariaLabel: 'Overdue — in progress',
      overdueHeadline: 'Overdue — in progress',
      varianceHeadline: null,
      loggedLaterHeadline: null,
      startVarianceTone: null,
      popoverLines: { ...popoverLines, lifecycleNotes },
    };
  }

  if (hasWorkOrderStartVariance(row)) {
    return {
      kind: 'lifecycle_variance',
      ariaLabel: lifecycleVarianceAriaLabel(row),
      overdueHeadline: null,
      varianceHeadline,
      loggedLaterHeadline: null,
      startVarianceTone,
      popoverLines,
    };
  }

  return {
    kind: 'none',
    ariaLabel: 'View planned and start dates',
    overdueHeadline: null,
    varianceHeadline: null,
    loggedLaterHeadline: null,
    startVarianceTone: null,
    popoverLines,
  };
}


export function formatWorkOrderStartColumn(order: WorkOrderDateFields): WorkOrderStartColumnLines {

  const calendarDate = getWorkOrderCalendarDateString(order);

  const plannedDate = order.planned_date?.trim() ? order.planned_date.slice(0, 10) : null;

  const { startedDay, completedDay } = lifecycleDaysFromRow({

    startedAt: order.started_at,

    completedAt: order.completed_at,

  });

  const plannedDay = getWorkOrderPlannedDay({ plannedDate, calendarDate });



  return {

    scheduled: getWorkOrderSheetDisplayDate({

      plannedDate,

      calendarDate,

    }),

    lifecycleNotes: buildLifecycleNotes(plannedDay, startedDay, completedDay),

  };

}



/** Sheet row variant when only date + lifecycle stamps are on the row model. */

export function formatWorkOrderStartColumnFromRow(row: WorkOrderSheetDateRow): WorkOrderStartColumnLines {

  const plannedDay = getWorkOrderPlannedDay(row);

  const { startedDay, completedDay } = lifecycleDaysFromRow(row);



  return {

    scheduled: getWorkOrderSheetDisplayDate(row),

    lifecycleNotes: buildLifecycleNotes(plannedDay, startedDay, completedDay),

  };

}



export function hasWorkOrderLifecycleVariance(row: WorkOrderSheetDateRow): boolean {

  const notes = formatWorkOrderStartColumnFromRow(row).lifecycleNotes;

  return notes.some((note) => note.text.includes(' early') || note.text.includes(' late'));

}



export interface WorkOrderDatePopoverLines {

  plannedLabel: string;

  lifecycleNotes: WorkOrderLifecycleNote[];

}



/** Popover body when planned vs actual start/completion days differ. */

export function formatWorkOrderDatePopoverLines(
  row: WorkOrderSheetDateRow & { updatedAt?: string | null },
): WorkOrderDatePopoverLines {
  const plannedDay = getWorkOrderPlannedDay(row);
  const { startedDay, completedDay } = lifecycleDaysFromRow(row);

  const lifecycleNotes = WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED
    ? (() => {
        const { lifecycleNotes: varianceNotes } = formatWorkOrderStartColumnFromRow(row);
        const loggedLaterDetail = getWorkOrderLoggedLaterDetail(row);
        return loggedLaterDetail
          ? [{ tone: 'completed' as const, text: loggedLaterDetail }, ...varianceNotes]
          : varianceNotes;
      })()
    : buildNeutralLifecycleNotes(startedDay, completedDay);

  return {
    plannedLabel: format(plannedDay, 'MMM d, yyyy'),
    lifecycleNotes,
  };
}


