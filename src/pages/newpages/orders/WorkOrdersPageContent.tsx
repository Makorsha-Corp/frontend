import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetWorkOrdersQuery,
  useDeleteWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import type { WorkOrder } from '@/types/workOrder';
import { Wrench, Plus, Search, PanelLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import WorkOrdersOverviewPanel from '@/components/newcomponents/customui/orders/WorkOrdersOverviewPanel';
import WorkOrderNavigatorPanel from '@/components/newcomponents/customui/orders/WorkOrderNavigatorPanel';
import AddWorkOrderDialog from '@/components/newcomponents/customui/orders/AddWorkOrderDialog';
import MaintenanceWizardDialog from '@/components/newcomponents/customui/orders/MaintenanceWizardDialog';
import WorkOrdersFilterStrip from '@/components/newcomponents/customui/orders/WorkOrdersFilterStrip';
import { useWorkOrdersFilters } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  WORK_ORDER_STATUS_OPTIONS,
  priorityLabel,
  workOrderStatusLabel,
} from './workOrderConstants';
import {
  filterWorkOrders,
  workOrderSummaryStats,
  type WorkOrderLabelContext,
  type WorkOrderPriorityFilter,
  type WorkOrderStatusFilter,
  type WorkTypeFilter,
} from './workOrdersOverviewData';
import { buildMachineIdToFactoryId } from './ordersOverviewData';

const WO_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

export interface WorkOrdersPageContentProps {
  embedded?: boolean;
  initialOrderId?: number | null;
}

/**
 * The full Work Orders browsing experience (header, filters, navigator, detail panel).
 */
const WorkOrdersPageContent: React.FC<WorkOrdersPageContentProps> = ({
  embedded = false,
  initialOrderId = null,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [advancedWizardOpen, setAdvancedWizardOpen] = useState(false);
  const [advancedMachineId, setAdvancedMachineId] = useState<number | null>(null);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [hubStatusScope, setHubStatusScope] = useState<string[] | null>(null);

  const {
    filters,
    setDateScope,
    setSheetDate,
    setFactoryFilter,
    setSectionFilter,
    setMachineFilter,
    setStatusFilter,
    setWorkTypeFilter,
    setPriorityFilter,
    setSearchQuery,
  } = useWorkOrdersFilters();

  const { data: orders = [], isLoading } = useGetWorkOrdersQuery({
    skip: 0,
    limit: WO_LIST_LIMIT,
  });
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factorySections = [] } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const [deleteOrder] = useDeleteWorkOrderMutation();

  const machineIdToFactoryId = useMemo(
    () => buildMachineIdToFactoryId(machines, factorySections),
    [machines, factorySections]
  );

  const machinesForFactory = useMemo(() => {
    if (filters.factoryFilter === 'all') return machines;
    const fid = Number(filters.factoryFilter);
    return machines.filter((m) => machineIdToFactoryId.get(m.id) === fid);
  }, [machines, filters.factoryFilter, machineIdToFactoryId]);

  const labelCtx: WorkOrderLabelContext = useMemo(
    () => ({
      factoryName: (id) => factories.find((f) => f.id === id)?.name ?? `Factory #${id}`,
      machineName: (id) =>
        id ? machines.find((m) => m.id === id)?.name ?? `Machine #${id}` : '—',
    }),
    [factories, machines]
  );

  const filterOpts = useMemo(
    () => ({
      from: filters.dateRange.from,
      to: filters.dateRange.to,
      status: filters.statusFilter,
      workType: filters.workTypeFilter,
      priority: filters.priorityFilter,
      factoryId: filters.factoryFilter,
      machineId: filters.machineFilter,
      searchQuery: filters.searchQuery,
    }),
    [filters],
  );

  const filteredOrders = useMemo(() => {
    const base = filterWorkOrders(orders, filterOpts, labelCtx);
    if (!hubStatusScope) return base;
    return base.filter((o) => hubStatusScope.includes(o.status));
  }, [orders, filterOpts, labelCtx, hubStatusScope]);

  const overviewStats = useMemo(() => workOrderSummaryStats(filteredOrders), [filteredOrders]);

  const mayTruncate = orders.length >= WO_LIST_LIMIT;

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) ??
    orders.find((o) => o.id === selectedOrderId) ??
    null;
  const selectedOrderFromUrl = searchParams.get('orderId');

  useEffect(() => {
    if (initialOrderId != null) setSelectedOrderId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (!selectedOrderFromUrl) return;
    const parsed = Number(selectedOrderFromUrl);
    if (Number.isNaN(parsed)) return;
    setSelectedOrderId(parsed);
  }, [selectedOrderFromUrl]);

  // One-time consumption of a hub deep link, e.g. `?status=DRAFT` or `?status=IN_PROGRESS`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const raw = searchParams.get('status');
    if (!raw) return;
    const names = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (names.length === 1 && WORK_ORDER_STATUS_OPTIONS.some((o) => o.value === names[0])) {
      setStatusFilter(names[0] as WorkOrderStatusFilter);
    } else if (names.length > 0) {
      setHubStatusScope(names);
    }
  }, []);

  const setSelectedOrder = (orderId: number | null) => {
    setSelectedOrderId(orderId);
    if (orderId == null) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      });
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('orderId', String(orderId));
      return next;
    });
  };

  const factoryName = (id: number) => labelCtx.factoryName(id);
  const machineName = (id: number | null) => labelCtx.machineName(id);
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';
  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const hasActiveFilters =
    filters.dateRange.from != null ||
    filters.dateRange.to != null ||
    filters.statusFilter !== 'all' ||
    filters.workTypeFilter !== 'all' ||
    filters.priorityFilter !== 'all' ||
    filters.factoryFilter !== 'all' ||
    filters.machineFilter !== 'all' ||
    hubStatusScope != null ||
    filters.searchQuery.trim().length > 0;

  const handleDelete = async (o: WorkOrder) => {
    if (!window.confirm(`Delete work order ${o.work_order_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Work order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  const advancedMachine = advancedMachineId
    ? machines.find((m) => m.id === advancedMachineId) ?? null
    : null;

  const openAdvancedMaintenance = () => {
    const mid =
      filters.machineFilter !== 'all'
        ? Number(filters.machineFilter)
        : machines[0]?.id ?? null;
    if (!mid) {
      toast.error('Select a machine for advanced maintenance');
      return;
    }
    setAdvancedMachineId(mid);
    setAdvancedWizardOpen(true);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {!embedded && (
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <Wrench className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                Work Orders
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by WO# or title..."
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={openAdvancedMaintenance}
                className={appShellHeaderControlClass}
              >
                Advanced maintenance
              </Button>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Work Order
              </Button>
            </div>
          </div>
        </AppShellHeader>
      )}

      <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={navigatorOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setNavigatorOpen((prev) => !prev)}
          className={`shrink-0 max-w-[280px] justify-start border-border bg-background ${appShellHeaderControlClass}`}
        >
          <PanelLeft className="mr-2 h-4 w-4 shrink-0" />
          {selectedOrder ? (
            <span className="truncate text-left">
              <span className="font-medium">{selectedOrder.work_order_number}</span>
              <span className="text-muted-foreground font-normal"> · {selectedOrder.title}</span>
            </span>
          ) : (
            <span className="truncate">
              Browse orders
              <span className="text-muted-foreground font-normal"> · {filteredOrders.length}</span>
            </span>
          )}
        </Button>

        <div className="hidden sm:block h-6 w-px bg-border shrink-0" aria-hidden />

        <WorkOrdersFilterStrip
          showHubFilters
          dateScope={filters.dateScope}
          sheetDate={filters.sheetDate}
          onDateScopeChange={setDateScope}
          onSheetDateChange={setSheetDate}
          statusFilter={filters.statusFilter}
          workTypeFilter={filters.workTypeFilter}
          priorityFilter={filters.priorityFilter}
          factoryFilter={filters.factoryFilter}
          sectionFilter={filters.sectionFilter}
          machineFilter={filters.machineFilter}
          searchQuery={filters.searchQuery}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setHubStatusScope(null);
          }}
          onWorkTypeChange={setWorkTypeFilter}
          onPriorityChange={setPriorityFilter}
          onFactoryChange={setFactoryFilter}
          onSectionChange={setSectionFilter}
          onMachineChange={setMachineFilter}
          onSearchChange={setSearchQuery}
          factories={factories}
          sections={factorySections}
          machines={machines}
          workOrderTypes={workOrderTypes}
          className="border-0 bg-transparent p-0 flex-1"
        />

        {embedded && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={openAdvancedMaintenance}>
              Advanced
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
        {navigatorOpen && (
          <WorkOrderNavigatorPanel
            onClose={() => setNavigatorOpen(false)}
            filteredOrders={filteredOrders}
            selectedOrderId={selectedOrderId}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onSelectOrder={(id) => setSelectedOrder(id)}
            onAddOrder={() => setIsAddOpen(true)}
            formatDate={formatDate}
          />
        )}

        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {selectedOrder ? (
            <WorkOrderDetailPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onDelete={() => handleDelete(selectedOrder)}
            />
          ) : (
            <WorkOrdersOverviewPanel
              orders={filteredOrders}
              stats={overviewStats}
              isLoading={isLoading}
              mayTruncate={mayTruncate}
              statusLabel={workOrderStatusLabel}
              priorityLabel={priorityLabel}
              factoryName={factoryName}
              machineName={machineName}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              onSelectOrder={(id) => setSelectedOrder(id)}
            />
          )}
        </div>
      </div>

      <AddWorkOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
        }}
      />

      {advancedMachine && (
        <MaintenanceWizardDialog
          open={advancedWizardOpen}
          onOpenChange={setAdvancedWizardOpen}
          machine={advancedMachine}
          onCreated={(id) => {
            setAdvancedWizardOpen(false);
            setSelectedOrder(id);
          }}
        />
      )}
    </div>
  );
};

export default WorkOrdersPageContent;
