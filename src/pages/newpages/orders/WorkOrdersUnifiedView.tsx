import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useDeleteWorkOrderMutation,
  useGetWorkOrdersSheetQuery,
} from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetWorkOrderTemplatesQuery } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import { API_LIMITS } from '@/constants/apiLimits';
import WorkOrdersPageHeader from '@/components/newcomponents/customui/orders/WorkOrdersPageHeader';
import WorkOrdersToolbar from '@/components/newcomponents/customui/orders/WorkOrdersToolbar';
import WorkOrdersFilterPanel from '@/components/newcomponents/customui/orders/WorkOrdersFilterPanel';
import WorkOrderSheetTable from '@/components/newcomponents/customui/orders/WorkOrderSheetTable';
import WorkOrderWeekRows from '@/components/newcomponents/customui/orders/WorkOrderWeekRows';
import SheetLogEntryFooter from '@/components/newcomponents/customui/orders/SheetLogEntryFooter';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import AddWorkOrderDialog from '@/components/newcomponents/customui/orders/AddWorkOrderDialog';
import MaintenanceWizardDialog from '@/components/newcomponents/customui/orders/MaintenanceWizardDialog';
import { useWorkOrdersFilters } from '@/pages/newpages/orders/useWorkOrdersFilters';
import {
  buildSheetDateGroups,
  buildSheetPeriodLabel,
  filterBundlesByOrderIds,
  flattenSheetBundles,
  flattenSheetBundlesToOrders,
  sheetDateGroupsToWeekDayCells,
} from '@/pages/newpages/orders/workOrderSheetData';
import {
  filterWorkOrders,
  type WorkOrderLabelContext,
} from '@/pages/newpages/orders/workOrdersOverviewData';
import { buildMachineIdToFactoryId } from '@/pages/newpages/orders/ordersOverviewData';
import {
  countWorkOrderPopoverFilters,
  filterMachinesForWorkOrderScope,
} from '@/pages/newpages/orders/workOrdersFilterUtils';
import { sliceToFactoryFilter } from '@/lib/machinesLocationFilterAdapters';
import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import type { WorkOrder } from '@/types/workOrder';

export interface WorkOrdersUnifiedViewProps {
  defaultMachineId?: number | null;
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
}

const WorkOrdersUnifiedView: React.FC<WorkOrdersUnifiedViewProps> = ({
  defaultMachineId,
  activeTab,
  onTabChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [footerDrawerOpen, setFooterDrawerOpen] = useState(false);
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const {
    highlighted: factoryPickerHighlight,
    pulseHighlight: pulseFactoryPickerHighlight,
    dismissHighlight: dismissFactoryPickerHighlight,
  } = useScrollTargetHighlight();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [advancedWizardOpen, setAdvancedWizardOpen] = useState(false);
  const [advancedMachineId, setAdvancedMachineId] = useState<number | null>(null);

  const {
    filters,
    dateViewMode,
    apiDateFrom,
    apiDateTo,
    setDateViewMode,
    setSheetDate,
    clearSheetDate,
    setFactoryFilter,
    setSectionFilter,
    setMachineFilter,
    setStatusFilter,
    setWorkTypeFilter,
    setPriorityFilter,
    setSearchQuery,
    pickDate,
    pickWeek,
    setShowCompleteOrders,
    patchParams,
  } = useWorkOrdersFilters();

  const weekPeriodLabel = useMemo(
    () =>
      dateViewMode === 'week' && filters.sheetDate
        ? buildSheetPeriodLabel('week', filters.sheetDate)
        : null,
    [dateViewMode, filters.sheetDate],
  );

  const applyDateFilter = filters.hasDateFilter;

  const popoverFilterCount = countWorkOrderPopoverFilters(filters);

  const factoryId = filters.factoryFilter !== 'all' ? Number(filters.factoryFilter) : undefined;
  const sectionId = filters.sectionFilter !== 'all' ? Number(filters.sectionFilter) : undefined;
  const resolvedMachineFilter = defaultMachineId
    ? String(defaultMachineId)
    : filters.machineFilter;
  const machineId =
    resolvedMachineFilter !== 'all' ? Number(resolvedMachineFilter) : undefined;

  const {
    data: bundles = [],
    isLoading,
    refetch,
    error,
  } = useGetWorkOrdersSheetQuery({
    factory_id: factoryId,
    machine_id: machineId,
    planned_date_from: applyDateFilter ? apiDateFrom : undefined,
    planned_date_to: applyDateFilter ? apiDateTo : undefined,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const logEntryDate = filters.sheetDate || format(new Date(), 'yyyy-MM-dd');

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: sections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: templates = [] } = useGetWorkOrderTemplatesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    is_active: true,
  });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { workspace, user } = useAppSelector((s) => s.auth);
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !workspace?.id });
  const [deleteOrder] = useDeleteWorkOrderMutation();

  const machineIdToFactoryId = useMemo(
    () => buildMachineIdToFactoryId(machines),
    [machines, sections],
  );

  const machineName = useCallback(
    (id: number | null) =>
      id ? machines.find((m) => m.id === id)?.name ?? `Machine #${id}` : '—',
    [machines],
  );

  const accountName = useCallback(
    (id: number | null) => (id ? accounts.find((a) => a.id === id)?.name ?? null : null),
    [accounts],
  );

  const sheetLabelCtx = useMemo(
    () => ({
      factoryName: (id: number) => factories.find((f) => f.id === id)?.name ?? `Factory #${id}`,
      sectionName: (machineId: number | null) => {
        if (!machineId) return null;
        const machine = machines.find((m) => m.id === machineId);
        if (!machine?.factory_section_id) return null;
        return sections.find((s) => s.id === machine.factory_section_id)?.name ?? null;
      },
    }),
    [factories, machines, sections],
  );

  const labelCtx: WorkOrderLabelContext = useMemo(
    () => ({
      factoryName: (id) => factories.find((f) => f.id === id)?.name ?? `Factory #${id}`,
      machineName,
    }),
    [factories, machineName],
  );

  const filterOptsBase = useMemo(
    () => ({
      status: filters.statusFilter,
      workType: filters.workTypeFilter,
      priority: filters.priorityFilter,
      factoryId: filters.factoryFilter,
      machineId: resolvedMachineFilter,
      searchQuery: filters.searchQuery,
      showCompleteOrders: filters.showCompleteOrders,
    }),
    [filters, resolvedMachineFilter],
  );

  const listSheetRows = useMemo(() => {
    const orders = flattenSheetBundlesToOrders(bundles);
    const filteredOrders = filterWorkOrders(
      orders,
      {
        ...filterOptsBase,
        from: applyDateFilter ? filters.dateRange.from : undefined,
        to: applyDateFilter ? filters.dateRange.to : undefined,
      },
      labelCtx,
    );
    const filteredOrderIds = new Set(filteredOrders.map((order) => order.id));
    const filteredBundles = filterBundlesByOrderIds(bundles, filteredOrderIds);
    return flattenSheetBundles(filteredBundles, machineName, accountName, sheetLabelCtx);
  }, [
    bundles,
    filterOptsBase,
    applyDateFilter,
    filters.dateRange.from,
    filters.dateRange.to,
    labelCtx,
    machineName,
    accountName,
    sheetLabelCtx,
  ]);

  const groupedDays = useMemo(() => {
    if (!applyDateFilter || !filters.sheetDate) return [];
    const groups = buildSheetDateGroups(
      listSheetRows,
      filters.dateScope,
      filters.sheetDate,
      [],
    );
    return sheetDateGroupsToWeekDayCells(groups);
  }, [applyDateFilter, filters.sheetDate, filters.dateScope, listSheetRows]);

  const handleSelectDay = useCallback(
    (date: string) => {
      setSheetDate(date);
    },
    [setSheetDate],
  );

  const orderById = useMemo(() => {
    const map = new Map<number, WorkOrder>();
    for (const bundle of bundles) map.set(bundle.order.id, bundle.order);
    return map;
  }, [bundles]);

  const filteredOrders = useMemo(
    () =>
      filterWorkOrders(
        flattenSheetBundlesToOrders(bundles),
        {
          ...filterOptsBase,
          from: applyDateFilter ? filters.dateRange.from : undefined,
          to: applyDateFilter ? filters.dateRange.to : undefined,
        },
        labelCtx,
      ),
    [bundles, filterOptsBase, applyDateFilter, filters.dateRange.from, filters.dateRange.to, labelCtx],
  );

  const machinesForToolbarSelect = useMemo(
    () =>
      filterMachinesForWorkOrderScope(
        machines,
        sections,
        filters.factoryFilter,
        filters.sectionFilter,
      ),
    [machines, sections, filters.factoryFilter, filters.sectionFilter],
  );

  const machinesInScope = useMemo(() => {
    let list = machines;
    if (sectionId) list = list.filter((m) => m.factory_section_id === sectionId);
    if (factoryId) list = list.filter((m) => machineIdToFactoryId.get(m.id) === factoryId);
    if (machineId) list = list.filter((m) => m.id === machineId);
    return list;
  }, [machines, sectionId, factoryId, machineId, machineIdToFactoryId]);

  const resolvedFactoryId =
    factoryId ??
    (defaultMachineId ? machineIdToFactoryId.get(defaultMachineId) ?? null : null);

  const footerRef = useRef<HTMLDivElement>(null);

  const factoryLabel = resolvedFactoryId ? labelCtx.factoryName(resolvedFactoryId) : null;

  const promptFactorySelect = useCallback(() => {
    pulseFactoryPickerHighlight();
    setFactoryPickerOpen(true);
  }, [pulseFactoryPickerHighlight]);

  useEffect(() => {
    if (resolvedFactoryId != null) {
      dismissFactoryPickerHighlight();
    }
  }, [resolvedFactoryId, dismissFactoryPickerHighlight]);

  const focusFooterForAdd = useCallback(() => {
    if (resolvedFactoryId == null) {
      promptFactorySelect();
      return;
    }
    setFooterDrawerOpen(true);
    requestAnimationFrame(() => {
      footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [resolvedFactoryId, promptFactorySelect]);

  const handleAddForDay = useCallback(
    (date: string) => {
      setSheetDate(date);
      focusFooterForAdd();
    },
    [setSheetDate, focusFooterForAdd],
  );

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) ??
    orderById.get(selectedOrderId ?? -1) ??
    null;

  const chipHandlers = useMemo(
    () => ({
      onClearFactory: () => setFactoryFilter('all'),
      onClearSection: () => setSectionFilter('all'),
      onClearMachine: () => setMachineFilter('all'),
      onClearStatus: () => setStatusFilter('all'),
      onClearWorkType: () => setWorkTypeFilter('all'),
      onClearPriority: () => setPriorityFilter('all'),
      onClearSearch: () => setSearchQuery(''),
      onClearDate: () => setDateViewMode('all'),
    }),
    [
      setFactoryFilter,
      setSectionFilter,
      setMachineFilter,
      setStatusFilter,
      setWorkTypeFilter,
      setPriorityFilter,
      setSearchQuery,
      setDateViewMode,
    ],
  );

  const clearPanelFilters = useCallback(() => {
    patchParams({
      woStatus: null,
      woType: null,
      woPriority: null,
    });
  }, [patchParams]);

  const handleLocationFilterChange = useCallback(
    (slice: MachinesLocationFilterSlice) => {
      const nextFactory = sliceToFactoryFilter(slice);
      const nextSection =
        slice.section_ids.length === 0 ? 'all' : String(slice.section_ids[0]);
      patchParams({
        woFactory: nextFactory === 'all' ? null : nextFactory,
        woSection: nextSection === 'all' ? null : nextSection,
        woMachine: null,
      });
    },
    [patchParams],
  );

  useEffect(() => {
    const raw = searchParams.get('orderId');
    if (!raw) return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setSelectedOrderId(parsed);
  }, [searchParams]);

  const setSelectedOrder = (orderId: number | null) => {
    setSelectedOrderId(orderId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (orderId == null) next.delete('orderId');
      else next.set('orderId', String(orderId));
      return next;
    });
  };

  const listEmptyActions = (
    <Button type="button" size="sm" onClick={focusFooterForAdd}>
      <Plus className="mr-1 h-4 w-4" />
      Add work
    </Button>
  );

  const handleDelete = async (o: WorkOrder) => {
    if (!window.confirm(`Delete work order ${o.work_order_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Work order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  const openAdvancedMaintenance = () => {
    const mid =
      resolvedMachineFilter !== 'all'
        ? Number(resolvedMachineFilter)
        : machines[0]?.id ?? null;
    if (!mid) {
      toast.error('Select a machine for advanced maintenance');
      return;
    }
    setAdvancedMachineId(mid);
    setAdvancedWizardOpen(true);
  };

  const advancedMachine = advancedMachineId
    ? machines.find((m) => m.id === advancedMachineId) ?? null
    : null;

  const sheetErrorDetail =
    error && 'data' in error
      ? (error.data as { detail?: string })?.detail
      : undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <WorkOrdersPageHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAddWork={focusFooterForAdd}
        onAdd={() => setIsAddOpen(true)}
        onAdvancedMaintenance={openAdvancedMaintenance}
        factories={factories}
        sections={sections}
        factoryFilter={filters.factoryFilter}
        sectionFilter={filters.sectionFilter}
        onLocationFilterChange={handleLocationFilterChange}
        factoryPickerOpen={factoryPickerOpen}
        onFactoryPickerOpenChange={setFactoryPickerOpen}
        factoryPickerHighlight={factoryPickerHighlight}
        onFactoryPickerHighlightDismiss={dismissFactoryPickerHighlight}
      />

      <WorkOrdersToolbar
        dateViewMode={dateViewMode}
        sheetDate={filters.sheetDate}
        weekPeriodLabel={weekPeriodLabel}
        onDateViewModeChange={setDateViewMode}
        onPickDate={pickDate}
        onPickWeek={pickWeek}
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        popoverFilterCount={popoverFilterCount}
        filtersPopover={
          <WorkOrdersFilterPanel
            filters={filters}
            statusFilter={filters.statusFilter}
            workTypeFilter={filters.workTypeFilter}
            priorityFilter={filters.priorityFilter}
            onStatusChange={setStatusFilter}
            onWorkTypeChange={setWorkTypeFilter}
            onPriorityChange={setPriorityFilter}
            onClearPanelFilters={clearPanelFilters}
            chipHandlers={chipHandlers}
            factories={factories}
            sections={sections}
            machines={machines}
            workOrderTypes={workOrderTypes}
          />
        }
        machineFilter={resolvedMachineFilter}
        onMachineChange={setMachineFilter}
        machines={machinesForToolbarSelect}
        machineSelectDisabled={defaultMachineId != null}
        showCompleteOrders={filters.showCompleteOrders}
        onShowCompleteOrdersChange={setShowCompleteOrders}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <p className="text-sm font-medium text-destructive">Failed to load work orders</p>
            <p className="text-xs">{sheetErrorDetail ?? 'Unknown error'}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : selectedOrder ? (
          <WorkOrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onDelete={() => handleDelete(selectedOrder)}
          />
        ) : applyDateFilter ? (
          <div className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <WorkOrderWeekRows
                days={groupedDays}
                onSelectDay={handleSelectDay}
                onAddForDay={handleAddForDay}
                onRowClick={(id) => setSelectedOrder(id)}
                currentUserId={user?.id ?? null}
                onSheetMutated={() => refetch()}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <WorkOrderSheetTable
                rows={listSheetRows}
                isLoading={isLoading}
                showStartDateColumn
                currentUserId={user?.id ?? null}
                onSheetMutated={() => refetch()}
                onRowClick={(id) => setSelectedOrder(id)}
                emptyActions={listEmptyActions}
              />
            </div>
          </div>
        )}
      </div>

      <SheetLogEntryFooter
        ref={footerRef}
        key={`footer-${sectionId ?? 'none'}-${defaultMachineId ?? 'none'}`}
        open={footerDrawerOpen}
        onOpenChange={setFooterDrawerOpen}
        sheetDate={logEntryDate}
        factoryId={resolvedFactoryId}
        factoryLabel={factoryLabel}
        sectionId={sectionId ?? null}
        machines={machinesInScope}
        workOrderTypes={workOrderTypes}
        partItems={items}
        templates={templates}
        accounts={accounts}
        members={members}
        defaultMachineId={defaultMachineId}
        onSuccess={() => refetch()}
        onRequestFactorySelect={promptFactorySelect}
      />

      <AddWorkOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
          refetch();
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
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default WorkOrdersUnifiedView;
