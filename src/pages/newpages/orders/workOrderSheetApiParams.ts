import { API_LIMITS } from '@/constants/apiLimits';
import type { ListWorkOrderSheetParams } from '@/types/workOrderSheet';
import type { WorkOrderFilters } from './workOrdersOverviewData';

export interface WorkOrderSheetPaginationState {
  page: number;
}

const SHEET_PAGE_SIZE = API_LIMITS.WORK_ORDERS_SHEET_PAGE_SIZE;

export function buildWorkOrderSheetQueryParams(
  filters: WorkOrderFilters,
  pagination: WorkOrderSheetPaginationState,
  scope: {
    factoryId?: number;
    machineId?: number;
    plannedDateFrom?: string;
    plannedDateTo?: string;
    boundedDateRange?: boolean;
  },
): ListWorkOrderSheetParams {
  const { page } = pagination;
  const statusFilter = filters.status;
  const bounded = Boolean(
    scope.boundedDateRange && scope.plannedDateFrom && scope.plannedDateTo,
  );

  return {
    factory_id: scope.factoryId,
    machine_id: scope.machineId,
    planned_date_from: scope.plannedDateFrom,
    planned_date_to: scope.plannedDateTo,
    status:
      statusFilter !== 'all' && statusFilter !== 'planned' ? statusFilter : undefined,
    status_scope: statusFilter === 'planned' ? 'planned' : undefined,
    work_order_type_id:
      filters.workType !== 'all' ? filters.workType : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
    exclude_completed: !filters.showCompleteOrders,
    search: filters.searchQuery.trim() || undefined,
    skip: bounded ? 0 : Math.max(0, (page - 1) * SHEET_PAGE_SIZE),
    limit: bounded ? API_LIMITS.WORK_ORDERS_SHEET_PAGE_MAX : SHEET_PAGE_SIZE,
  };
}

export function parseWorkOrderSheetPage(raw: string | null): number {
  const parsed = Number(raw ?? '1');
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function sheetPageCount(total: number, pageSize: number = SHEET_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function buildWorkOrderSheetDailyCountsParams(
  filters: WorkOrderFilters,
  scope: {
    factoryId?: number;
    machineId?: number;
    plannedDateFrom: string;
    plannedDateTo: string;
  },
) {
  const statusFilter = filters.status;

  return {
    factory_id: scope.factoryId,
    machine_id: scope.machineId,
    planned_date_from: scope.plannedDateFrom,
    planned_date_to: scope.plannedDateTo,
    status:
      statusFilter !== 'all' && statusFilter !== 'planned' ? statusFilter : undefined,
    work_order_type_id: filters.workType !== 'all' ? filters.workType : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
  };
}
