import { useMemo } from 'react';
import { startOfDay, parseISO } from 'date-fns';
import { useAppSelector } from '@/app/hooks';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProductionBatchesQuery, useGetProductionLinesQuery } from '@/features/production/productionApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
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
import { isOpenInvoiceBalance } from '@/components/newcomponents/customui/accounts/accountInvoiceTotals';
import type { Project } from '@/types/project';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import type { AccountInvoice } from '@/types/accountInvoice';
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
  machines: Machine[],
  sectionById: Map<number, FactorySection>,
  payableInvoices: AccountInvoice[],
  accountNameById: Map<number, string>,
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

  for (const inv of payableInvoices) {
    if (inv.invoice_status === 'voided' || inv.payment_status !== 'overdue') continue;
    const due = inv.due_date ? parseISO(inv.due_date.slice(0, 10)) : now;
    const accountName = accountNameById.get(inv.account_id) ?? `Account #${inv.account_id}`;
    items.push({
      id: `payable-${inv.id}`,
      kind: 'overdue_payable',
      title: `${accountName} · overdue payable`,
      subtitle: `$${inv.outstanding_amount.toLocaleString()} outstanding`,
      sortKey: due.getTime(),
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

  const maintenanceHorizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  for (const machine of machines) {
    if (!machine.next_maintenance_schedule) continue;
    const d = new Date(machine.next_maintenance_schedule);
    if (Number.isNaN(d.getTime()) || d > maintenanceHorizon) continue;
    const section = machine.factory_section_id != null ? sectionById.get(machine.factory_section_id) : undefined;
    const sectionLabel = section?.name ?? machine.factory_section_name;
    items.push({
      id: `machine-${machine.id}`,
      kind: 'maintenance',
      title: machine.name,
      subtitle: sectionLabel
        ? `${sectionLabel} · ${machine.next_maintenance_schedule.slice(0, 10)}`
        : machine.next_maintenance_schedule.slice(0, 10),
      sortKey: d.getTime(),
      href: section
        ? `/factories/${section.factory_id}/sections/${section.id}`
        : `/factories/${machine.factory_id}`,
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
  const { data: allBatchesRaw = [], isLoading: loadAllBatches, isError: errAllBatches } =
    useGetProductionBatchesQuery({
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    });

  const { data: payableInvoices = [], isLoading: loadPayable, isError: errPayable } =
    useGetAccountInvoicesQuery(
      { skip: 0, limit: API_LIMITS.INVOICES_HUB, invoice_type: 'payable' },
      { skip: false }
    );
  const { data: receivableInvoices = [], isLoading: loadReceivable, isError: errReceivable } =
    useGetAccountInvoicesQuery(
      { skip: 0, limit: API_LIMITS.INVOICES_HUB, invoice_type: 'receivable' },
      { skip: false }
    );
  const { data: accounts = [], isLoading: loadAccounts, isError: errAccounts } = useGetAccountsQuery(
    { skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX },
    { skip: false }
  );

  const { data: inventoryList = [], isLoading: loadInventory, isError: errInventory } =
    useGetInventoryListQuery({
      skip: 0,
      limit: 500,
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
    loadLines ||
    loadBatches ||
    loadAllBatches ||
    loadPayable ||
    loadReceivable ||
    loadAccounts ||
    loadInventory ||
    (isOwner && (loadWorkspace || loadInvites));

  const hasError =
    scopeError ||
    errPr ||
    errLines ||
    errBatches ||
    errAllBatches ||
    errPayable ||
    errReceivable ||
    errAccounts ||
    errInventory ||
    (isOwner && (errWorkspace || errInvites));

  const sectionById = useMemo(
    () => new Map(factorySections.map((s) => [s.id, s])),
    [factorySections]
  );

  const accountNameById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
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

  const lineIdsForFactory = useMemo(() => {
    const lines =
      factoryId != null ? productionLines.filter((l) => l.factory_id === factoryId) : productionLines;
    return new Set(lines.map((l) => l.id));
  }, [productionLines, factoryId]);

  const batchesInProgressScoped = useMemo(() => {
    if (factoryId == null) return batchesInProgressRaw;
    return batchesInProgressRaw.filter((b) => lineIdsForFactory.has(b.production_line_id));
  }, [batchesInProgressRaw, factoryId, lineIdsForFactory]);

  const batchesScoped = useMemo(() => {
    if (factoryId == null) return allBatchesRaw;
    return allBatchesRaw.filter((b) => lineIdsForFactory.has(b.production_line_id));
  }, [allBatchesRaw, factoryId, lineIdsForFactory]);

  const inventoryScoped = useMemo(() => {
    return inventoryList.filter((inv) => (inv.qty ?? 0) > 0);
  }, [inventoryList]);

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

    const payableOutstanding = payableInvoices
      .filter((inv) => isOpenInvoiceBalance(inv))
      .reduce((sum, inv) => sum + inv.outstanding_amount, 0);
    const receivableOutstanding = receivableInvoices
      .filter((inv) => isOpenInvoiceBalance(inv))
      .reduce((sum, inv) => sum + inv.outstanding_amount, 0);

    const overdueInvoiceCount =
      payableInvoices.filter(
        (inv) => inv.invoice_status !== 'voided' && inv.payment_status === 'overdue'
      ).length +
      receivableInvoices.filter(
        (inv) => inv.invoice_status !== 'voided' && inv.payment_status === 'overdue'
      ).length;

    const storageEstimatedValue = inventoryScoped.reduce(
      (sum, inv) => sum + (inv.qty ?? 0) * (inv.avg_price ?? 0),
      0
    );

    const machinesRunningCount = machinesScoped.filter((m) => m.is_running && m.is_active).length;

    return {
      openOrdersCount: openOrders.length,
      openOrdersPendingValue: stats.pendingValue,
      activeProjectsCount: activeProjects.length,
      planningProjectsCount: planningProjects.length,
      batchesInProgressCount: batchesInProgressScoped.length,
      maintenanceDueCount: maintenanceDue.length,
      netArAp: receivableOutstanding - payableOutstanding,
      overdueInvoiceCount,
      pendingApprovalsCount: stats.pendingApprovalsCount,
      storageEstimatedValue,
      machinesRunningCount,
    };
  }, [
    scopedOrders,
    projectsScoped,
    batchesInProgressScoped,
    machinesScoped,
    payableInvoices,
    receivableInvoices,
    inventoryScoped,
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
        machinesScoped,
        sectionById,
        payableInvoices,
        accountNameById,
        notInvoicedCount,
        batchesScoped,
        new Date()
      ),
    [
      scopedOrders,
      projectsScoped,
      machinesScoped,
      sectionById,
      payableInvoices,
      accountNameById,
      notInvoicedCount,
      batchesScoped,
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
    salesMayTruncate,
  };
}
