import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { displaySystemStatusName } from '@/i18n/systemLabels';
import { normalizeUiLanguage, type UiLanguage } from '@/i18n/uiLanguage';
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
import { formatOverviewCurrency } from '@/components/newcomponents/customui/orders/overview/ordersOverviewConstants';

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
  now: Date,
  t: TFunction,
  uiLanguage: UiLanguage,
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];
  const statusLabel = (name: string) => displaySystemStatusName(name, t, uiLanguage);

  for (const order of orders) {
    if (!isOrderOverdue(order, now)) continue;
    const due = order.dueOrExpectedDate ? parseISO(order.dueOrExpectedDate.slice(0, 10)) : now;
    items.push({
      id: `order-${order.kind}-${order.id}`,
      kind: 'overdue_order',
      title: t('attentionOrderOverdueTitle', { ref: order.ref, ns: 'dashboard' }),
      subtitle: t('attentionOrderOverdueSubtitle', {
        ns: 'dashboard',
        status: statusLabel(order.statusLabel),
        date: order.dueOrExpectedDate ?? '—',
      }),
      sortKey: due.getTime(),
      href: ORDER_TYPE_PATHS[order.kind],
    });
  }

  for (const order of orders) {
    if (!isPendingApprovalOrder(order)) continue;
    const detail =
      order.amount > 0
        ? formatOverviewCurrency(order.amount)
        : t('attentionReviewRequired', { ns: 'dashboard' });
    items.push({
      id: `approval-${order.kind}-${order.id}`,
      kind: 'pending_approval',
      title: t('attentionAwaitingApprovalTitle', { ref: order.ref, ns: 'dashboard' }),
      subtitle: t('attentionAwaitingApprovalSubtitle', {
        ns: 'dashboard',
        status: statusLabel(order.statusLabel),
        detail,
      }),
      sortKey: order.createdAt.getTime(),
      href: ORDER_TYPE_PATHS[order.kind],
    });
  }

  if (overduePayableCount > 0) {
    items.push({
      id: 'overdue-payable-summary',
      kind: 'overdue_payable',
      title: t('attentionOverduePayable', { count: overduePayableCount, ns: 'dashboard' }),
      subtitle: t('attentionOverduePayableSubtitle', { ns: 'dashboard' }),
      sortKey: now.getTime(),
      href: '/accounts/payable',
    });
  }

  if (notInvoicedCount > 0) {
    items.push({
      id: 'not-invoiced-summary',
      kind: 'not_invoiced',
      title: t('attentionNotInvoiced', { count: notInvoicedCount, ns: 'dashboard' }),
      subtitle: t('attentionNotInvoicedSubtitle', { ns: 'dashboard' }),
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
      subtitle:
        d < startOfDay(now)
          ? t('attentionDeadlinePassed', { ns: 'dashboard' })
          : t('attentionDeadlineOn', { date: project.deadline.slice(0, 10), ns: 'dashboard' }),
      sortKey: d.getTime(),
      href: '/project',
    });
  }

  const machineLabels = {
    overdueWord: t('attentionMachineOverdue', { ns: 'dashboard' }),
    itemsLabel: (count: number) => t('attentionMachineItems', { count, ns: 'dashboard' }),
  };

  for (const row of mapUpcomingWorkToAttentionRows(upcomingMachineWork, sectionById, machineLabels)) {
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
      title: t('attentionBatchTitle', {
        ns: 'dashboard',
        batch: batch.batch_number ?? batch.id,
        pct: variancePct.toFixed(1),
      }),
      subtitle:
        batch.status === 'in_progress'
          ? t('attentionBatchInProgress', { ns: 'dashboard' })
          : t('attentionBatchCompleted', { ns: 'dashboard' }),
      sortKey: batch.updated_at ? new Date(batch.updated_at).getTime() : now.getTime(),
      href: '/production',
    });
  }

  return items.sort((a, b) => a.sortKey - b.sortKey).slice(0, ATTENTION_LIMIT);
}

export function useDashboardData() {
  const { t, i18n } = useTranslation(['dashboard', 'misc']);
  const uiLanguage = normalizeUiLanguage(i18n.language);
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
        new Date(),
        t,
        uiLanguage,
      ),
    [
      scopedOrders,
      projectsScoped,
      upcomingMachineWork,
      sectionById,
      invoicesHubSummary?.payable.overdueCount,
      notInvoicedCount,
      batchesInProgressRaw,
      t,
      uiLanguage,
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
    hubOrdersMayTruncate,
  };
}
