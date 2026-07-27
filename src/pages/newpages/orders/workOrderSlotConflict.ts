import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';

const OPEN_SLOT_STATUSES = new Set<WorkOrderStatus>(['DRAFT', 'IN_PROGRESS']);

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
  excludeWorkOrderId?: number;
}

function plannedDateIso(order: Pick<WorkOrder, 'planned_date'>): string | null {
  const raw = order.planned_date?.trim();
  return raw ? raw.slice(0, 10) : null;
}

export function findOpenWorkOrderSlotConflict(
  args: FindOpenWorkOrderSlotConflictArgs,
): WorkOrderSlotConflict | null {
  const { orders, machineId, workOrderTypeId, plannedDate, excludeWorkOrderId } = args;

  const matches = orders.filter((order) => {
    if (excludeWorkOrderId != null && order.id === excludeWorkOrderId) return false;
    if (order.machine_id !== machineId) return false;
    if (order.work_order_type_id !== workOrderTypeId) return false;
    if (plannedDateIso(order) !== plannedDate) return false;
    return OPEN_SLOT_STATUSES.has(order.status);
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
