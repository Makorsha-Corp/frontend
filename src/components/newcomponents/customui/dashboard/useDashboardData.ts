import { useMemo } from 'react';
import { startOfDay, parseISO } from 'date-fns';
import { useAppSelector } from '@/app/hooks';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProductionBatchesQuery, useGetProductionLinesQuery } from '@/features/production/productionApi';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  filterOverviewOrders,
  isCompletedStatusLabel,
  summaryStats,
  type OverviewOrder,
} from '@/pages/newpages/orders/ordersOverviewData';
import { useOrdersScopeData } from '@/pages/newpages/orders/useOrdersScopeData';
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

  const {
    allNormalized,
    machines,
    factorySections,
    isLoading: scopeLoading,
    hasError: scopeError,
    salesMayTruncate,
  } = useOrdersScopeData();

  const { data: projects = [], isLoading: loadPr, isError: errPr } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    factory_id: factoryId ?? undefined,
  });
  const { data: productionLines = [], isLoading: loadLines, isError: errLines } =
    useGetProductionLinesQuery({
      skip: 0,
      limit: API_LIMITS.STRICT_100,
      factory_id: factoryId ?? undefined,
      active_only: false,
    });
  const { data: batchesInProgressRaw = [], isLoading: loadBatches, isError: errBatches } =
    useGetProductionBatchesQuery({
      skip: 0,
      limit: API_LIMITS.STRICT_100,
      status: 'in_progress',
    });

  const isLoading = scopeLoading || loadPr || loadLines || loadBatches;
  const hasError = scopeError || errPr || errLines || errBatches;

  const sectionById = useMemo(
    () => new Map(factorySections.map((s) => [s.id, s])),
    [factorySections]
  );

  const scopedOrders = useMemo(
    () =>
      filterOverviewOrders(allNormalized, {
        factoryId: factoryId != null ? String(factoryId) : 'all',
        statusFilter: 'all',
      }),
    [allNormalized, factoryId]
  );

  const projectsScoped = useMemo(
    () => filterProjectsByFactory(projects, factoryId),
    [projects, factoryId]
  );

  const machinesScoped = useMemo(
    () => filterMachinesByFactory(machines, factorySections, factoryId),
    [machines, factorySections, factoryId]
  );

  const lineIdsForFactory = useMemo(() => {
    const lines =
      factoryId != null ? productionLines.filter((l) => l.factory_id === factoryId) : productionLines;
    return new Set(lines.map((l) => l.id));
  }, [productionLines, factoryId]);

  const batchesInProgressScoped = useMemo(() => {
    if (factoryId == null) return batchesInProgressRaw;
    return batchesInProgressRaw.filter((b) => lineIdsForFactory.has(b.production_line_id));
  }, [batchesInProgressRaw, factoryId, lineIdsForFactory]);

  const kpis: DashboardKpis = useMemo(() => {
    const now = new Date();
    const stats = summaryStats(scopedOrders, now);
    const openOrders = scopedOrders.filter((o) => !isCompletedStatusLabel(o.statusLabel));
    const activeProjects = projectsScoped.filter((p) => p.status === 'IN_PROGRESS');
    const planningProjects = projectsScoped.filter((p) => (p.status ?? 'PLANNING') === 'PLANNING');

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
      batchesInProgressCount: batchesInProgressScoped.length,
      maintenanceDueCount: maintenanceDue.length,
    };
  }, [scopedOrders, projectsScoped, batchesInProgressScoped, machinesScoped]);

  const attentionItems = useMemo(
    () => buildAttentionItems(scopedOrders, projectsScoped, machinesScoped, sectionById, new Date()),
    [scopedOrders, projectsScoped, machinesScoped, sectionById]
  );

  return {
    factory,
    factoryId,
    kpis,
    attentionItems,
    isLoading,
    hasError,
    salesMayTruncate,
  };
}
