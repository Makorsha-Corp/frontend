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



/** Sheet Date column: started_at day when set, else planned/calendar day. */

export function getWorkOrderSheetDisplayDate(row: {

  plannedDate: string | null;

  calendarDate: string;

  startedAt: string | null;

}): string {

  if (row.startedAt) {

    return format(startOfDay(parseApiDateTime(row.startedAt)), 'MMM d');

  }

  const fallback = row.plannedDate?.trim() || row.calendarDate;

  return format(startOfDay(parseISO(fallback)), 'MMM d');

}



type WorkOrderSheetDateRow = {

  plannedDate: string | null;

  calendarDate: string;

  startedAt: string | null;

  completedAt: string | null;

};



/** Start column helper for order objects (hub/detail). */

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

      startedAt: order.started_at,

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

  return formatWorkOrderStartColumnFromRow(row).lifecycleNotes.length > 0;

}



export interface WorkOrderDatePopoverLines {

  plannedLabel: string;

  lifecycleNotes: WorkOrderLifecycleNote[];

}



/** Popover body when planned vs actual start/completion days differ. */

export function formatWorkOrderDatePopoverLines(row: WorkOrderSheetDateRow): WorkOrderDatePopoverLines {

  const plannedDay = getWorkOrderPlannedDay(row);

  const { lifecycleNotes } = formatWorkOrderStartColumnFromRow(row);



  return {

    plannedLabel: format(plannedDay, 'MMM d, yyyy'),

    lifecycleNotes,

  };

}


