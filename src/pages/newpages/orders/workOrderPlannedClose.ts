import { parseISO, startOfDay } from 'date-fns';

import type { WorkOrderStatus } from '@/types/workOrder';

/** True when planned_date is today or in the past (calendar day). */
export function isPlannedDateOnOrBeforeToday(
  plannedDate: string | null | undefined,
  referenceDate: Date = startOfDay(new Date()),
): boolean {
  const raw = plannedDate?.trim();
  if (!raw) return false;
  try {
    return startOfDay(parseISO(raw.slice(0, 10))) <= referenceDate;
  } catch {
    return false;
  }
}

/** Draft backlog logs managers can close with planned-date actuals. */
export function canCompleteWorkOrderAsPlanned(
  status: WorkOrderStatus,
  plannedDate: string | null | undefined,
  approvalMet: boolean,
  referenceDate: Date = startOfDay(new Date()),
): boolean {
  return (
    status === 'DRAFT' &&
    approvalMet &&
    isPlannedDateOnOrBeforeToday(plannedDate, referenceDate)
  );
}
