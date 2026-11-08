import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';
import { parseApiDateTime } from '@/utils/datetime';
import { untimedDayBounds, windowsIntersect } from './workOrderWindow';

const OPEN_SLOT_STATUSES = new Set<WorkOrderStatus>(['DRAFT', 'RECURRING', 'IN_PROGRESS']);

export interface WorkOrderSlotConflict {
  workOrderId: number;
  workOrderNumber: string;
  status: WorkOrderStatus;
  worksName: string;
}

export type WorkOrderSlotConflictOrder = Pick<
  WorkOrder,
  | 'id'
  | 'machine_id'
  | 'work_order_type_id'
  | 'planned_date'
  | 'planned_start_at'
  | 'planned_end_at'
  | 'status'
  | 'work_order_number'
  | 'work_order_type_name'
  | 'title'
  | 'created_at'
>;

export interface FindOpenWorkOrderSlotConflictArgs {
  orders: WorkOrderSlotConflictOrder[];
  machineId: number;
  workOrderTypeId: number;
  plannedDate: string;
  /** Omitted candidate is untimed for the whole plannedDate. */
  candidateStart?: string | null;
  candidateEnd?: string | null;
  timeZone?: string;
  excludeWorkOrderId?: number;
}

function windowFor(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  plannedDate: string,
  timeZone: string,
): { start: Date; end: Date } {
  const start = startIso ? parseApiDateTime(startIso) : null;
  const end = endIso ? parseApiDateTime(endIso) : null;
  if (start && end) return { start, end };
  return untimedDayBounds(plannedDate, timeZone);
}

function plannedDateIso(order: Pick<WorkOrder, 'planned_date'>): string | null {
  const raw = order.planned_date?.trim();
  return raw ? raw.slice(0, 10) : null;
}

export function findOpenWorkOrderSlotConflict(
  args: FindOpenWorkOrderSlotConflictArgs,
): WorkOrderSlotConflict | null {
  const {
    orders,
    machineId,
    workOrderTypeId,
    plannedDate,
    excludeWorkOrderId,
    candidateStart,
    candidateEnd,
    timeZone = 'Asia/Dhaka',
  } = args;

  const candidate = windowFor(candidateStart, candidateEnd, plannedDate, timeZone);

  const matches = orders.filter((order) => {
    if (excludeWorkOrderId != null && order.id === excludeWorkOrderId) return false;
    if (order.machine_id !== machineId) return false;
    if (order.work_order_type_id !== workOrderTypeId) return false;
    if (!OPEN_SLOT_STATUSES.has(order.status)) return false;
    const otherDate = plannedDateIso(order);
    if (!otherDate) return false;
    const other = windowFor(order.planned_start_at, order.planned_end_at, otherDate, timeZone);
    return windowsIntersect(candidate.start, candidate.end, other.start, other.end);
  });

  if (matches.length === 0) return null;

  const best = [...matches].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  return {
    workOrderId: best.id,
    workOrderNumber: best.work_order_number,
    status: best.status,
    worksName: best.work_order_type_name ?? best.title,
  };
}
