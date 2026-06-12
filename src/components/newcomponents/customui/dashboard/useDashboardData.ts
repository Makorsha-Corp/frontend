import { useMemo } from 'react';
import { subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useAppSelector } from '@/app/hooks';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetTransferOrdersQuery } from '@/features/transferOrders/transferOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProductionBatchesQuery, useGetProductionLinesQuery } from '@/features/production/productionApi';
import { API_LIMITS } from '@/constants/apiLimits';
import { useSalesOrdersForOverview } from '@/pages/newpages/orders/useSalesOrdersForOverview';
import {
  aggregateCountsByType,
  bucketOrdersOverTime,
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
  filterOverviewOrders,
  isCompletedStatusLabel,
  normalizeOrders,
  recentOrders,
  summaryStats,
  type OverviewOrder,
} from '@/pages/newpages/orders/ordersOverviewData';
import type { Project } from '@/types/project';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import { ORDER_TYPE_PATHS } from './dashboardConstants';

export type DashboardAttentionKind = 'overdue_order' | 'project_deadline' | 'maintenance';

export interface DashboardAttentionItem {
  id: string;
  kind: DashboardAttentionKind;
  title: string;
  subtitle: string;
  sortKey: number;
  href: string;
}

export interface DashboardKpis {
  openOrdersCount: number;
  openOrdersPendingValue: number;
  activeProjectsCount: number;
  planningProjectsCount: number;
  batchesInProgressCount: number;
  maintenanceDueCount: number;
}

function filterProjectsByFactory(projects: Project[], factoryId: number | null): Project[] {
  if (factoryId == null) return projects;
  return projects.filter((p) => p.factory_id === factoryId);
}

function filterMachinesByFactory(
  machines: Machine[],
  sections: FactorySection[],
  factoryId: number | null
): Machine[] {
  if (factoryId == null) return machines;
  const sectionIds = new Set(sections.filter((s) => s.factory_id === factoryId).map((s) => s.id));
  return machines.filter((m) => sectionIds.has(m.factory_section_id));
}

function isOrderOverdue(order: OverviewOrder, now: Date): boolean {
  if (isCompletedStatusLabel(order.statusLabel)) return false;
  const raw = order.dueOrExpectedDate;
  if (!raw) return false;
  try {
    const d = parseISO(raw.length > 10 ? raw : `${raw}T23:59:59`);
    return d < startOfDay(now);
  } catch {
    return false;
  }
}

function buildAttentionItems(
  orders: OverviewOrder[],
  projects: Project[],
  machines: Machine[],
  sectionById: Map<number, FactorySection>,
  now: Date
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  for (const order of orders) {
    if (!isOrderOverdue(order, now)) continue;
    const due = order.dueOrExpectedDate ? parseISO(order.dueOrExpectedDate.slice(0, 10)) : now;
    items.push({
      id: `order-${order.kind}-${order.id}`,
      kind: 'overdue_order',
      title: `${order.ref} overdue`,
      subtitle: `${order.statusLabel} · due ${order.dueOrExpectedDate ?? '—'}`,
      sortKey: due.getTime(),
      href: ORDER_TYPE_PATHS[order.kind],
    });
  }

  for (const project of projects) {
    if (!project.deadline) continue;
    const d = new Date(project.deadline);
    if (Number.isNaN(d.getTime())) continue;
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (d > horizon) continue;
    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') continue;
    items.push({
      id: `project-${project.id}`,
      kind: 'project_deadline',
      title: project.name,
      subtitle: d < startOfDay(now) ? 'Deadline passed' : `Deadline ${project.deadline.slice(0, 10)}`,
      sortKey: d.getTime(),
      href: '/project',
    });
  }

  const maintenanceHorizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  for (const machine of machines) {
    if (!machine.next_maintenance_schedule) continue;
    const d = new Date(machine.next_maintenance_schedule);
    if (Number.isNaN(d.getTime()) || d > maintenanceHorizon) continue;
    const section = sectionById.get(machine.factory_section_id);
    items.push({
      id: `machine-${machine.id}`,
      kind: 'maintenance',
      title: machine.name,
      subtitle: section
        ? `${section.name} · ${machine.next_maintenance_schedule.slice(0, 10)}`
        : machine.next_maintenance_schedule.slice(0, 10),
      sortKey: d.getTime(),
      href: section ? `/factories/${section.factory_id}/sections/${section.id}` : '/factories',
    });
  }

  return items.sort((a, b) => a.sortKey - b.sortKey).slice(0, 5);
}

export function useDashboardData() {
  const factory = useAppSelector((state) => state.auth.factory);
  const factoryId = factory?.id ?? null;

  const { data: purchaseOrders = [], isLoading: loadPo, isError: errPo } = useGetPurchaseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: transferOrders = [], isLoading: loadTo, isError: errTo } = useGetTransferOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: expenseOrders = [], isLoading: loadEo, isError: errEo } = useGetExpenseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const {
    salesOrders,
    isLoading: loadSo,
    isError: errSo,
    mayTruncate: salesMayTruncate,
  } = useSalesOrdersForOverview();
  const { data: workOrders = [], isLoading: loadWo, isError: errWo } = useGetWorkOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: statuses = [], isLoading: loadSt, isError: errSt } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: machines = [], isLoading: loadMa, isError: errMa } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factorySections = [], isLoading: loadSec, isError: errSec } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [], isLoading: loadPr, isError: errPr } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    factory_id: factoryId ?? undefined,
  });
  const { data: productionLines = [], isLoading: loadLines, isError: errLines } =
    useGetProductionLinesQuery({
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      factory_id: factoryId ?? undefined,
      active_only: false,
    });
  const { data: batchesRaw = [], isLoading: loadBatches, isError: errBatches } =
    useGetProductionBatchesQuery({
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    });

  const isLoading =
    loadPo ||
    loadTo ||
    loadEo ||
    loadSo ||
    loadWo ||
    loadSt ||
    loadMa ||
    loadSec ||
    loadPr ||
    loadLines ||
    loadBatches;
  const hasError = errPo || errTo || errEo || errSo || errWo || errSt || errMa || errSec || errPr || errLines || errBatches;

  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);
  const sectionById = useMemo(
    () => new Map(factorySections.map((s) => [s.id, s])),
    [factorySections]
  );

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
  );

  const allOrders = useMemo(
    () =>
      normalizeOrders(
        purchaseOrders,
        transferOrders,
        expenseOrders,
        salesOrders,
        workOrders,
        statusById,
        resolutionMaps
      ),
    [purchaseOrders, transferOrders, expenseOrders, salesOrders, workOrders, statusById, resolutionMaps]
  );

  const scopedOrders = useMemo(
    () =>
      filterOverviewOrders(allOrders, {
        factoryId: factoryId != null ? String(factoryId) : 'all',
        statusFilter: 'all',
      }),
    [allOrders, factoryId]
  );

  const trendRange = useMemo(() => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, 29));
    return { from, to };
  }, []);

  const trendData = useMemo(
    () => bucketOrdersOverTime(scopedOrders, trendRange.from, trendRange.to),
    [scopedOrders, trendRange.from, trendRange.to]
  );

  const ordersByType = useMemo(() => aggregateCountsByType(scopedOrders), [scopedOrders]);

  const recentOrdersList = useMemo(() => recentOrders(scopedOrders, 5), [scopedOrders]);

  const projectsScoped = useMemo(
    () => filterProjectsByFactory(projects, factoryId),
    [projects, factoryId]
  );

  const machinesScoped = useMemo(
    () => filterMachinesByFactory(machines, factorySections, factoryId),
    [machines, factorySections, factoryId]
  );

  const lineIdsForFactory = useMemo(() => {
    const lines = factoryId != null ? productionLines.filter((l) => l.factory_id === factoryId) : productionLines;
    return new Set(lines.map((l) => l.id));
  }, [productionLines, factoryId]);

  const batchesScoped = useMemo(() => {
    if (factoryId == null) return batchesRaw;
    return batchesRaw.filter((b) => lineIdsForFactory.has(b.production_line_id));
  }, [batchesRaw, factoryId, lineIdsForFactory]);

  const kpis: DashboardKpis = useMemo(() => {
    const now = new Date();
    const stats = summaryStats(scopedOrders, now);
    const openOrders = scopedOrders.filter((o) => !isCompletedStatusLabel(o.statusLabel));
    const activeProjects = projectsScoped.filter((p) => p.status === 'IN_PROGRESS');
    const planningProjects = projectsScoped.filter((p) => (p.status ?? 'PLANNING') === 'PLANNING');
    const batchesInProgress = batchesScoped.filter((b) => b.status === 'in_progress');

    const maintenanceHorizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const maintenanceDue = machinesScoped.filter((m) => {
      if (!m.next_maintenance_schedule) return false;
      const d = new Date(m.next_maintenance_schedule);
      return !Number.isNaN(d.getTime()) && d <= maintenanceHorizon;
    });

    return {
      openOrdersCount: openOrders.length,
      openOrdersPendingValue: stats.pendingValue,
      activeProjectsCount: activeProjects.length,
      planningProjectsCount: planningProjects.length,
      batchesInProgressCount: batchesInProgress.length,
      maintenanceDueCount: maintenanceDue.length,
    };
  }, [scopedOrders, projectsScoped, batchesScoped, machinesScoped]);

  const attentionItems = useMemo(
    () => buildAttentionItems(scopedOrders, projectsScoped, machinesScoped, sectionById, new Date()),
    [scopedOrders, projectsScoped, machinesScoped, sectionById]
  );

  const totalOrdersCount = scopedOrders.length;

  return {
    factory,
    factoryId,
    kpis,
    trendData,
    ordersByType,
    recentOrdersList,
    attentionItems,
    totalOrdersCount,
    isLoading,
    hasError,
    salesMayTruncate,
  };
}
