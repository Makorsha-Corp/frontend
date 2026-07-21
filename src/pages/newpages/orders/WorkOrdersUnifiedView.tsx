import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, format, isSameMonth, parseISO, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useDeleteWorkOrderMutation,
  useGetWorkOrdersSheetQuery,
  useGetWorkOrderSheetDailyCountsQuery,
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
import WorkOrdersToolbar, {
  type WorkOrdersToolbarWeekNav,
} from '@/components/newcomponents/customui/orders/WorkOrdersToolbar';
import WorkOrdersFilterPanel from '@/components/newcomponents/customui/orders/WorkOrdersFilterPanel';
import WorkOrderSheetTable from '@/components/newcomponents/customui/orders/WorkOrderSheetTable';
import WorkOrderWeekCalendar from '@/components/newcomponents/customui/orders/WorkOrderWeekCalendar';
import SheetLogEntryFooter from '@/components/newcomponents/customui/orders/SheetLogEntryFooter';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import AddWorkOrderDialog from '@/components/newcomponents/customui/orders/AddWorkOrderDialog';
import MaintenanceWizardDialog from '@/components/newcomponents/customui/orders/MaintenanceWizardDialog';
import { useWorkOrdersFilters } from '@/pages/newpages/orders/useWorkOrdersFilters';
import {
  flattenSheetBundlesToOrders,
  sheetCalendarGridBounds,
} from '@/pages/newpages/orders/workOrderSheetData';
import {
  filterWorkOrders,
  type WorkOrderLabelContext,
} from '@/pages/newpages/orders/workOrdersOverviewData';
import { deriveWorkOrderWeekCalendarView } from '@/pages/newpages/orders/workOrderWeekCalendarData';
import { buildMachineIdToFactoryId } from '@/pages/newpages/orders/ordersOverviewData';
import {
  countActiveWorkOrderFilters,
  filterMachinesForWorkOrderScope,
} from '@/pages/newpages/orders/workOrdersFilterUtils';
import { sliceToFactoryFilter } from '@/lib/machinesLocationFilterAdapters';
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [advancedWizardOpen, setAdvancedWizardOpen] = useState(false);
  const [advancedMachineId, setAdvancedMachineId] = useState<number | null>(null);

  const {
    filters,
    layoutMode,
    weekView,
    apiDateFrom,
    apiDateTo,
    setDateScope,
    setLayoutMode,
    setWeekView,
    setSheetDate,
    clearSheetDate,
    setFactoryFilter,
    setSectionFilter,
    setMachineFilter,
    setStatusFilter,
    setWorkTypeFilter,
    setPriorityFilter,
    setSearchQuery,
    patchParams,
  } = useWorkOrdersFilters();

  const [calendarMonth, setCalendarMonth] = useState(() =>
    filters.sheetDate ? parseISO(filters.sheetDate) : new Date(),
  );

  useEffect(() => {
    if (!filters.sheetDate) return;
    const next = parseISO(filters.sheetDate);
    setCalendarMonth((prev) => (isSameMonth(prev, next) ? prev : next));
  }, [filters.sheetDate]);

  const activeFilterCount = countActiveWorkOrderFilters(filters, layoutMode);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(
    () => activeFilterCount > 0 || layoutMode === 'week',
  );

  useEffect(() => {
    if (layoutMode === 'week') setFiltersPanelOpen(true);
  }, [layoutMode]);

  const factoryId = filters.factoryFilter !== 'all' ? Number(filters.factoryFilter) : undefined;
  const sectionId = filters.sectionFilter !== 'all' ? Number(filters.sectionFilter) : undefined;
  const resolvedMachineFilter = defaultMachineId
    ? String(defaultMachineId)
    : filters.machineFilter;
  const machineId =
    resolvedMachineFilter !== 'all' ? Number(resolvedMachineFilter) : undefined;

  const applyDateFilter = layoutMode === 'week' && filters.hasDateFilter;
  const useAdjacentWeeks =
    layoutMode === 'week' && filters.dateScope === 'week' && applyDateFilter;

  const calendarGridRange = useMemo(() => {
    const { from, to } = sheetCalendarGridBounds(calendarMonth);
    return {
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    };
  }, [calendarMonth]);

  const sheetFetchDates = useMemo(() => {
    if (!applyDateFilter || !filters.dateRange.from || !filters.dateRange.to) {
      return { from: apiDateFrom, to: apiDateTo };
    }
    if (useAdjacentWeeks) {
      return calendarGridRange;
    }
    return { from: apiDateFrom, to: apiDateTo };
  }, [
    applyDateFilter,
    useAdjacentWeeks,
    filters.dateRange.from,
    filters.dateRange.to,
    calendarGridRange,
    apiDateFrom,
    apiDateTo,
  ]);

  const {
    data: bundles = [],
    isLoading,
    refetch,
    error,
  } = useGetWorkOrdersSheetQuery({
    factory_id: factoryId,
    machine_id: machineId,
    start_date_from: applyDateFilter ? sheetFetchDates.from : undefined,
    start_date_to: applyDateFilter ? sheetFetchDates.to : undefined,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const { data: orderCountByDate = {} } = useGetWorkOrderSheetDailyCountsQuery(
    {
      factory_id: factoryId,
      machine_id: machineId,
      start_date_from: calendarGridRange.from,
      start_date_to: calendarGridRange.to,
      status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
      work_order_type_id: filters.workTypeFilter !== 'all' ? filters.workTypeFilter : undefined,
      priority: filters.priorityFilter !== 'all' ? filters.priorityFilter : undefined,
    },
    { skip: layoutMode !== 'week' },
  );

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
    () => buildMachineIdToFactoryId(machines, sections),
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
    }),
    [filters, resolvedMachineFilter],
  );

  const ordersFromSheet = useMemo(
    () => flattenSheetBundlesToOrders(bundles),
    [bundles],
  );

  const filteredOrders = useMemo(
    () =>
      filterWorkOrders(
        ordersFromSheet,
        {
          ...filterOptsBase,
          from: applyDateFilter ? filters.dateRange.from : undefined,
          to: applyDateFilter ? filters.dateRange.to : undefined,
        },
        labelCtx,
      ),
    [ordersFromSheet, filterOptsBase, applyDateFilter, filters.dateRange.from, filters.dateRange.to, labelCtx],
  );

  const {
    calendarSheetRows,
    orderCountByDate: derivedOrderCountByDate,
    anchorWeekSection,
    listSheetRows,
  } = useMemo(
    () =>
      deriveWorkOrderWeekCalendarView({
        bundles,
        calendarMonth,
        sheetDate: filters.sheetDate ?? '',
        anchorWeekFrom: filters.dateRange.from,
        anchorWeekTo: filters.dateRange.to,
        filterOptsBase,
        orderCountByDateFromApi: orderCountByDate,
        searchQuery: filters.searchQuery,
        machineName,
        accountName,
        sheetLabelCtx,
        labelCtx,
        useWeekCalendar: layoutMode === 'week' && applyDateFilter,
      }),
    [
      bundles,
      calendarMonth,
      filters.sheetDate,
      filters.dateRange.from,
      filters.dateRange.to,
      filterOptsBase,
      orderCountByDate,
      filters.searchQuery,
      machineName,
      accountName,
      sheetLabelCtx,
      labelCtx,
      layoutMode,
      applyDateFilter,
    ],
  );

  const weekOrderCountByDate =
    layoutMode === 'week' && applyDateFilter ? derivedOrderCountByDate : orderCountByDate;

  const shiftAnchorWeek = useCallback(
    (direction: 'prev' | 'next') => {
      if (!filters.sheetDate) return;
      const base = parseISO(filters.sheetDate);
      const shifted = direction === 'prev' ? subDays(base, 7) : addDays(base, 7);
      setSheetDate(format(shifted, 'yyyy-MM-dd'));
    },
    [filters.sheetDate, setSheetDate],
  );

  const goToToday = useCallback(() => {
    setSheetDate(format(new Date(), 'yyyy-MM-dd'));
  }, [setSheetDate]);

  const handleSelectDay = useCallback(
    (date: string) => {
      setSheetDate(date);
    },
    [setSheetDate],
  );

  const toolbarWeekNav = useMemo((): WorkOrdersToolbarWeekNav | undefined => {
    if (layoutMode !== 'week' || filters.dateScope !== 'week' || !filters.sheetDate) {
      return undefined;
    }

    return {
      sheetDate: filters.sheetDate,
      calendarSheetRows,
      orderCountByDate: weekOrderCountByDate,
      calendarMonth,
      onCalendarMonthChange: setCalendarMonth,
      onNavigatePrev: () => shiftAnchorWeek('prev'),
      onNavigateNext: () => shiftAnchorWeek('next'),
      onSheetDateChange: setSheetDate,
      onGoToToday: goToToday,
    };
  }, [
    layoutMode,
    filters.dateScope,
    filters.sheetDate,
    calendarSheetRows,
    weekOrderCountByDate,
    calendarMonth,
    shiftAnchorWeek,
    setSheetDate,
    goToToday,
  ]);

  const orderById = useMemo(() => {
    const map = new Map<number, WorkOrder>();
    for (const bundle of bundles) map.set(bundle.order.id, bundle.order);
    return map;
  }, [bundles]);

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

  const focusFooterForAdd = useCallback(() => {
    setFooterDrawerOpen(true);
    requestAnimationFrame(() => {
      footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

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
      onClearDate: () => clearSheetDate(),
    }),
    [
      setFactoryFilter,
      setSectionFilter,
      setMachineFilter,
      setStatusFilter,
      setWorkTypeFilter,
      setPriorityFilter,
      setSearchQuery,
      clearSheetDate,
    ],
  );

  const clearPanelFilters = useCallback(() => {
    patchParams({
      woStatus: null,
      woType: null,
      woPriority: null,
      woSearch: null,
      ...(layoutMode === 'list' ? { woDate: null, woDateScope: null } : {}),
    });
  }, [patchParams, layoutMode]);

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
    if (layoutMode === 'week' && !filters.hasDateFilter) {
      setSheetDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [layoutMode, filters.hasDateFilter, setSheetDate]);

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
    <Button type="button" size="sm" onClick={() => setFooterDrawerOpen(true)}>
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
        addWorkDisabled={resolvedFactoryId == null}
        factories={factories}
        sections={sections}
        factoryFilter={filters.factoryFilter}
        sectionFilter={filters.sectionFilter}
        onLocationFilterChange={handleLocationFilterChange}
      />

      <WorkOrdersToolbar
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        filtersPanelOpen={filtersPanelOpen}
        onFiltersPanelOpenChange={setFiltersPanelOpen}
        activeFilterCount={activeFilterCount}
        weekNav={toolbarWeekNav}
        weekView={weekView}
        onWeekViewChange={setWeekView}
        machineFilter={resolvedMachineFilter}
        onMachineChange={setMachineFilter}
        machines={machinesForToolbarSelect}
        machineSelectDisabled={defaultMachineId != null}
      />

      {filtersPanelOpen && (
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
      )}

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
        ) : layoutMode === 'list' ? (
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
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <WorkOrderWeekCalendar
                weekSection={anchorWeekSection}
                selectedDate={filters.sheetDate || logEntryDate}
                weekView={weekView}
                isLoading={isLoading}
                onSelectDay={handleSelectDay}
                onAddForDay={handleAddForDay}
                onRowClick={(id) => setSelectedOrder(id)}
                currentUserId={user?.id ?? null}
                onSheetMutated={() => refetch()}
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
