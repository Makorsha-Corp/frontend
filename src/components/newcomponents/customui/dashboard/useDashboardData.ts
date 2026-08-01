import { useMemo } from 'react';
import { startOfDay, parseISO } from 'date-fns';
import { useAppSelector } from '@/app/hooks';
import { useGetUpcomingMachineWorkQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProductionBatchesQuery, useGetProductionBatchStatsQuery } from '@/features/production/productionApi';
import { useGetAccountInvoicesHubSummaryQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetInventoryStatsQuery } from '@/features/inventory/inventoryApi';
import {
  useGetWorkspaceQuery,
  useGetWorkspaceInvitationsQuery,
} from '@/features/workspaces/workspaceApi';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  filterOverviewOrders,
  isCompletedStatusLabel,
  isPendingApprovalOrder,
  summaryStats,
  extendedOverviewStats,
  recentOrders,
  type OverviewOrder,
} from '@/pages/newpages/orders/ordersOverviewData';
import { useOrdersScopeData } from '@/pages/newpages/orders/useOrdersScopeData';
import type { Project } from '@/types/project';
import type { Machine } from '@/types/machine';
import type { MachineUpcomingWorkRow } from '@/types/machineUpcomingWork';
import { mapUpcomingWorkToAttentionRows, splitUpcomingWorkByDueWindow } from '@/lib/machineUpcomingWork';
import type { FactorySection } from '@/types/factorySection';
import type { ProductionBatch } from '@/types/production';
import { ORDER_TYPE_PATHS } from './dashboardConstants';

export type DashboardAttentionKind =
  | 'overdue_order'
  | 'project_deadline'
  | 'maintenance'
  | 'pending_approval'
  | 'overdue_payable'
  | 'not_invoiced'
  | 'batch_variance';

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
  upcomingMachineWorkCount: number;
  overdueMachineWorkCount: number;
  upcomingMachineWorkItemCount: number;
  netArAp: number;
  overdueInvoiceCount: number;
  pendingApprovalsCount: number;
  storageEstimatedValue: number;
  machinesRunningCount: number;
}

export interface DashboardWorkspacePulse {
  membersCount: number;
  ordersThisMonth: number;
  maxOrdersPerMonth: number | null;
  pendingInvitesCount: number;
}

const ATTENTION_LIMIT = 8;
const RECENT_ORDERS_LIMIT = 8;

function filterProjectsByFactory(projects: Project[], factoryId: number | null): Project[] {
  if (factoryId == null) return projects;
  return projects.filter((p) => p.factory_id === factoryId);
}

function filterMachinesByFactory(machines: Machine[], factoryId: number | null): Machine[] {
  if (factoryId == null) return machines;
  return machines.filter((m) => m.factory_id === factoryId);
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

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function buildAttentionItems(
  orders: OverviewOrder[],
  projects: Project[],
  upcomingMachineWork: MachineUpcomingWorkRow[],
  sectionById: Map<number, FactorySection>,
  overduePayableCount: number,
  notInvoicedCount: number,
  batches: ProductionBatch[],
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

  for (const order of orders) {
    if (!isPendingApprovalOrder(order)) continue;
    items.push({
      id: `approval-${order.kind}-${order.id}`,
      kind: 'pending_approval',
      title: `${order.ref} awaiting approval`,
      subtitle: `${order.statusLabel} · ${order.amount > 0 ? `$${order.amount.toLocaleString()}` : 'Review required'}`,
      sortKey: order.createdAt.getTime(),
      href: ORDER_TYPE_PATHS[order.kind],
    });
  }

  if (overduePayableCount > 0) {
    items.push({
      id: 'overdue-payable-summary',
      kind: 'overdue_payable',
      title:
        overduePayableCount === 1
          ? '1 overdue payable invoice'
          : `${overduePayableCount} overdue payable invoices`,
      subtitle: 'Review accounts payable',
      sortKey: now.getTime(),
      href: '/accounts/payable',
    });
  }

  if (notInvoicedCount > 0) {
    items.push({
      id: 'not-invoiced-summary',
      kind: 'not_invoiced',
      title:
        notInvoicedCount === 1
          ? '1 completed order not invoiced'
          : `${notInvoicedCount} completed orders not invoiced`,
      subtitle: 'Purchase and expense orders missing invoices',
      sortKey: now.getTime(),
      href: '/orders/purchase',
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

  for (const row of mapUpcomingWorkToAttentionRows(upcomingMachineWork, sectionById)) {
    items.push({
      id: row.id,
      kind: 'maintenance',
      title: row.title,
      subtitle: row.subtitle,
      sortKey: row.sortKey,
      href: row.href,
    });
  }

  for (const batch of batches) {
    if (batch.status !== 'in_progress' && batch.status !== 'completed') continue;
    const variancePct = toFiniteNumber(batch.output_variance_percentage);
    if (variancePct == null || variancePct >= 0) continue;
    items.push({
      id: `batch-${batch.id}`,
      kind: 'batch_variance',
      title: `Batch ${batch.batch_number ?? batch.id} · ${variancePct.toFixed(1)}% output`,
      subtitle: batch.status === 'in_progress' ? 'In progress · below expected output' : 'Completed below target',
      sortKey: batch.updated_at ? new Date(batch.updated_at).getTime() : now.getTime(),
      href: '/production',
    });
  }

  return items.sort((a, b) => a.sortKey - b.sortKey).slice(0, ATTENTION_LIMIT);
}

export function useDashboardData() {
  const factory = useAppSelector((state) => state.auth.factory);
  const workspace = useAppSelector((state) => state.auth.workspace);
  const factoryId = factory?.id ?? null;
  const workspaceId = workspace?.id ?? null;
  const isOwner = workspace?.role === 'owner';

  const {
    allNormalized,
    statusById,
    purchaseOrders,
    expenseOrders,
    machines,
    factorySections,
    isLoading: scopeLoading,
    hasError: scopeError,
    salesMayTruncate,
    hubOrdersMayTruncate,
  } = useOrdersScopeData();

  const { data: upcomingMachineWork = [], isLoading: loadUpcomingWork, isError: errUpcomingWork } =
    useGetUpcomingMachineWorkQuery({
      within_days: 7,
      factory_id: factoryId ?? undefined,
      include_overdue: true,
    });

  const { data: projects = [], isLoading: loadPr, isError: errPr } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    factory_id: factoryId ?? undefined,
  });

  const { data: batchesInProgressRaw = [], isLoading: loadBatches, isError: errBatches } =
    useGetProductionBatchesQuery({
      skip: 0,
      limit: API_LIMITS.STRICT_100,
      status: 'in_progress',
    });

  const { data: invoicesHubSummary, isLoading: loadInvoicesHub, isError: errInvoicesHub } =
    useGetAccountInvoicesHubSummaryQuery();

  const { data: inventoryStats, isLoading: loadInventory, isError: errInventory } =
    useGetInventoryStatsQuery({
      factory_id: factoryId ?? undefined,
      include_zero_qty: false,
    });

  const { data: batchStats, isLoading: loadBatchStats, isError: errBatchStats } =
    useGetProductionBatchStatsQuery({
      factory_id: factoryId ?? undefined,
    });

  const { data: workspaceDetails, isLoading: loadWorkspace, isError: errWorkspace } =
    useGetWorkspaceQuery(workspaceId!, { skip: workspaceId == null || !isOwner });

  const { data: invitationsRaw = [], isLoading: loadInvites, isError: errInvites } =
    useGetWorkspaceInvitationsQuery(
      { workspaceId: workspaceId! },
      { skip: workspaceId == null || !isOwner }
    );

  const pendingInvitations = useMemo(
    () => invitationsRaw.filter((inv) => inv.status === 'pending'),
    [invitationsRaw]
  );

  const isLoading =
    scopeLoading ||
    loadPr ||
    loadBatches ||
    loadInvoicesHub ||
    loadInventory ||
    loadBatchStats ||
    loadUpcomingWork ||
    (isOwner && (loadWorkspace || loadInvites));

  const hasError =
    scopeError ||
    errPr ||
    errBatches ||
    errInvoicesHub ||
    errInventory ||
    errBatchStats ||
    errUpcomingWork ||
    (isOwner && (errWorkspace || errInvites));

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
    () => filterMachinesByFactory(machines, factoryId),
    [machines, factoryId]
  );

  const batchesInProgressCount = batchStats?.inProgressCount ?? batchesInProgressRaw.length;

  const splitMachineWork = useMemo(
    () => splitUpcomingWorkByDueWindow(upcomingMachineWork, sectionById, 7),
    [upcomingMachineWork, sectionById]
  );

  const kpis: DashboardKpis = useMemo(() => {
    const now = new Date();
    const stats = summaryStats(scopedOrders, now);
    const openOrders = scopedOrders.filter((o) => !isCompletedStatusLabel(o.statusLabel));
    const activeProjects = projectsScoped.filter((p) => p.status === 'IN_PROGRESS');
    const planningProjects = projectsScoped.filter((p) => (p.status ?? 'PLANNING') === 'PLANNING');

    const upcomingMachineWorkCount = upcomingMachineWork.length;
    const overdueMachineWorkCount = splitMachineWork.overdueCount;
    const upcomingMachineWorkItemCount = splitMachineWork.upcomingCount;

    const payableOutstanding = invoicesHubSummary?.payable.outstandingTotal ?? 0;
    const receivableOutstanding = invoicesHubSummary?.receivable.outstandingTotal ?? 0;

    const overdueInvoiceCount =
      (invoicesHubSummary?.payable.overdueCount ?? 0) +
      (invoicesHubSummary?.receivable.overdueCount ?? 0);

    const storageEstimatedValue = toFiniteNumber(inventoryStats?.estimated_value) ?? 0;

    const machinesRunningCount = machinesScoped.filter((m) => m.is_running && m.is_active).length;

    return {
      openOrdersCount: openOrders.length,
      openOrdersPendingValue: stats.pendingValue,
      activeProjectsCount: activeProjects.length,
      planningProjectsCount: planningProjects.length,
      batchesInProgressCount,
      maintenanceDueCount: overdueMachineWorkCount + upcomingMachineWorkItemCount,
      upcomingMachineWorkCount,
      overdueMachineWorkCount,
      upcomingMachineWorkItemCount,
      netArAp: receivableOutstanding - payableOutstanding,
      overdueInvoiceCount,
      pendingApprovalsCount: stats.pendingApprovalsCount,
      storageEstimatedValue,
      machinesRunningCount,
    };
  }, [
    scopedOrders,
    projectsScoped,
    batchesInProgressCount,
    upcomingMachineWork,
    splitMachineWork,
    invoicesHubSummary,
    inventoryStats,
    machinesScoped,
  ]);

  const notInvoicedCount = useMemo(
    () =>
      extendedOverviewStats(
        scopedOrders,
        new Date(),
        purchaseOrders,
        expenseOrders,
        statusById
      ).notInvoicedCount,
    [scopedOrders, purchaseOrders, expenseOrders, statusById]
  );

  const attentionItems = useMemo(
    () =>
      buildAttentionItems(
        scopedOrders,
        projectsScoped,
        upcomingMachineWork,
        sectionById,
        invoicesHubSummary?.payable.overdueCount ?? 0,
        notInvoicedCount,
        batchesInProgressRaw,
        new Date()
      ),
    [
      scopedOrders,
      projectsScoped,
      upcomingMachineWork,
      sectionById,
      invoicesHubSummary?.payable.overdueCount,
      notInvoicedCount,
      batchesInProgressRaw,
    ]
  );

  const recentOrdersList = useMemo(
    () => recentOrders(scopedOrders, RECENT_ORDERS_LIMIT),
    [scopedOrders]
  );

  const workspacePulse: DashboardWorkspacePulse | null = useMemo(() => {
    if (!isOwner || !workspaceDetails) return null;
    return {
      membersCount: workspaceDetails.current_members_count ?? 0,
      ordersThisMonth: workspaceDetails.current_orders_this_month ?? 0,
      maxOrdersPerMonth: workspaceDetails.max_orders_per_month ?? null,
      pendingInvitesCount: pendingInvitations.length,
    };
  }, [isOwner, workspaceDetails, pendingInvitations.length]);

  return {
    factory,
    factoryId,
    isOwner,
    kpis,
    attentionItems,
    recentOrders: recentOrdersList,
    workspacePulse,
    isLoading,
    hasError,
    salesMayTruncate: salesMayTruncate || hubOrdersMayTruncate,
    hubOrdersMayTruncate,
  };
}
