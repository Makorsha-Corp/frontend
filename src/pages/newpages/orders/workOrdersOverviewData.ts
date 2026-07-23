import { endOfDay, isWithinInterval, startOfDay } from 'date-fns';
import type { WorkOrder, WorkOrderPriority, WorkOrderStatus } from '@/types/workOrder';
import {
  isWorkOrderOpen,
  isWorkOrderComplete,
  priorityLabel,
  workOrderStatusLabel,
} from './workOrderConstants';
import { getWorkOrderCalendarDate } from './workOrderDateUtils';

export type WorkOrderStatusFilter = 'all' | WorkOrderStatus;
export type WorkTypeFilter = 'all' | number;
export type WorkOrderPriorityFilter = 'all' | WorkOrderPriority;

export interface WorkOrderLabelContext {
  factoryName: (id: number) => string;
  machineName: (id: number | null) => string;
}

export interface WorkOrderFilters {
  from?: Date;
  to?: Date;
  status: WorkOrderStatusFilter;
  workType: WorkTypeFilter;
  priority: WorkOrderPriorityFilter;
  factoryId: string;
  machineId: string;
  searchQuery: string;
  /** When false, completed work orders are hidden. Default true in UI. */
  showCompleteOrders: boolean;
}

export interface WorkOrderSummaryStats {
  totalCount: number;
  openCount: number;
  pendingApprovalCount: number;
  totalCost: number;
}

function reportDateForWorkOrder(order: WorkOrder): Date {
  return getWorkOrderCalendarDate(order);
}

export function filterWorkOrders(
  orders: WorkOrder[],
  filters: WorkOrderFilters,
  labelCtx: WorkOrderLabelContext
): WorkOrder[] {
  let rows = orders.filter((o) => !o.is_deleted);

  if (filters.from && filters.to) {
    const interval = { start: startOfDay(filters.from), end: endOfDay(filters.to) };
    rows = rows.filter((o) => isWithinInterval(reportDateForWorkOrder(o), interval));
  }

  if (filters.status !== 'all') {
    rows = rows.filter((o) => o.status === filters.status);
  }

  if (filters.workType !== 'all') {
    rows = rows.filter((o) => o.work_order_type_id === filters.workType);
  }

  if (filters.priority !== 'all') {
    rows = rows.filter((o) => o.priority === filters.priority);
  }

  if (filters.factoryId !== 'all') {
    const fid = Number(filters.factoryId);
    rows = rows.filter((o) => o.factory_id === fid);
  }

  if (filters.machineId !== 'all') {
    const mid = Number(filters.machineId);
    rows = rows.filter((o) => o.machine_id === mid);
  }

  if (!filters.showCompleteOrders) {
    rows = rows.filter((o) => !isWorkOrderComplete(o.status));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    rows = rows.filter((o) => {
      const factory = labelCtx.factoryName(o.factory_id).toLowerCase();
      const machine = labelCtx.machineName(o.machine_id).toLowerCase();
      return (
        o.work_order_number?.toLowerCase().includes(q) ||
        o.title?.toLowerCase().includes(q) ||
        (o.assigned_to?.toLowerCase().includes(q) ?? false) ||
        workOrderStatusLabel(o.status).toLowerCase().includes(q) ||
        (o.work_order_type_name?.toLowerCase().includes(q) ?? false) ||
        priorityLabel(o.priority).toLowerCase().includes(q) ||
        factory.includes(q) ||
        machine.includes(q)
      );
    });
  }

  return rows;
}

export function workOrderSummaryStats(orders: WorkOrder[]): WorkOrderSummaryStats {
  let openCount = 0;
  let pendingApprovalCount = 0;
  let totalCost = 0;

  for (const o of orders) {
    if (isWorkOrderOpen(o.status)) {
      openCount += 1;
    }
    if (o.status === 'DRAFT') {
      pendingApprovalCount += 1;
    }
    totalCost += Number(o.cost ?? 0);
  }

  return {
    totalCount: orders.length,
    openCount,
    pendingApprovalCount,
    totalCost,
  };
}
