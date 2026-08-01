import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useDeleteWorkOrderMutation,
  useGetWorkOrderByIdQuery,
  useGetWorkOrdersSheetQuery,
  useGetWorkOrderSheetDailyCountsQuery,
} from '@/features/workOrders/workOrdersApi';
import {
  useGetWorkOrderTemplatesQuery,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import { API_LIMITS } from '@/constants/apiLimits';
import WorkOrdersPageHeader from '@/components/newcomponents/customui/orders/WorkOrdersPageHeader';
import WorkOrdersToolbar from '@/components/newcomponents/customui/orders/WorkOrdersToolbar';
import WorkOrdersFilterPanel from '@/components/newcomponents/customui/orders/WorkOrdersFilterPanel';
import WorkOrderSheetTable from '@/components/newcomponents/customui/orders/WorkOrderSheetTable';
import WorkOrdersSheetPagination from '@/components/newcomponents/customui/orders/WorkOrdersSheetPagination';
import WorkOrderWeekRows from '@/components/newcomponents/customui/orders/WorkOrderWeekRows';
import SheetLogEntryFooter from '@/components/newcomponents/customui/orders/SheetLogEntryFooter';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import WorkOrderTemplateSelectorDialog from '@/components/newcomponents/customui/orders/WorkOrderTemplateSelectorDialog';
import RecurringProgramsManagerDialog from '@/components/newcomponents/customui/orders/RecurringProgramsManagerDialog';
import { useWorkOrdersFilters } from '@/pages/newpages/orders/useWorkOrdersFilters';
import {
  buildSheetDateGroups,
  buildSheetPeriodLabel,
  flattenSheetBundles,
  flattenSheetBundlesToOrders,
  sheetCalendarGridBounds,
  sheetDateGroupsToWeekDayCells,
} from '@/pages/newpages/orders/workOrderSheetData';
import {
  buildWorkOrderSheetDailyCountsParams,
  buildWorkOrderSheetQueryParams,
  sheetPageCount,
} from '@/pages/newpages/orders/workOrderSheetApiParams';
import type { WorkOrderFilters } from '@/pages/newpages/orders/workOrdersOverviewData';
import { buildProgramSummariesByWorkOrderId } from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import { useRecurrenceProgramOrdersForSheet } from '@/pages/newpages/orders/useRecurrenceProgramOrdersForSheet';
import { buildMachineIdToFactoryId } from '@/pages/newpages/orders/ordersOverviewData';
import {
  countWorkOrderPopoverFilters,
  filterMachinesForWorkOrderScope,
} from '@/pages/newpages/orders/workOrdersFilterUtils';
import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';
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
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [recurringProgramsOpen, setRecurringProgramsOpen] = useState(false);
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const {
    highlighted: factoryPickerHighlight,
    pulseHighlight: pulseFactoryPickerHighlight,
    dismissHighlight: dismissFactoryPickerHighlight,
  } = useScrollTargetHighlight();
  const [pickerCalendarMonth, setPickerCalendarMonth] = useState(() => startOfMonth(new Date()));

  const {
    filters,
    dateViewMode,
    apiDateFrom,
    apiDateTo,
    setDateViewMode,
    setSheetDate,
    clearSheetDate,
    setFactoryFilter,
    setLocationFilterSlice,
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
    sheetPage,
    setSheetPage,
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

  const sheetFilterOpts: WorkOrderFilters = useMemo(
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

  const pickerCalendarBounds = useMemo(
    () => sheetCalendarGridBounds(pickerCalendarMonth),
    [pickerCalendarMonth],
  );

  const dailyCountsParams = useMemo(
    () =>
      buildWorkOrderSheetDailyCountsParams(sheetFilterOpts, {
        factoryId,
        machineId,
        plannedDateFrom: format(pickerCalendarBounds.from, 'yyyy-MM-dd'),
        plannedDateTo: format(pickerCalendarBounds.to, 'yyyy-MM-dd'),
      }),
    [sheetFilterOpts, factoryId, machineId, pickerCalendarBounds],
  );

  const { data: orderCountByDate = {} } = useGetWorkOrderSheetDailyCountsQuery(
    dailyCountsParams,
    { skip: selectedOrderId != null },
  );

  const sheetQueryParams = useMemo(
    () =>
      buildWorkOrderSheetQueryParams(
        sheetFilterOpts,
        { page: sheetPage },
        {
          factoryId,
          machineId,
          plannedDateFrom: applyDateFilter ? apiDateFrom : undefined,
          plannedDateTo: applyDateFilter ? apiDateTo : undefined,
          boundedDateRange: dateViewMode === 'week' || dateViewMode === 'day',
        },
      ),
    [
      sheetFilterOpts,
      sheetPage,
      factoryId,
      machineId,
      applyDateFilter,
      apiDateFrom,
      apiDateTo,
      dateViewMode,
    ],
  );

  const {
    data: sheetData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetWorkOrdersSheetQuery(sheetQueryParams);

  const bundles = sheetData?.items ?? [];
  const sheetTotal = sheetData?.total ?? 0;

  const [deleteOrder] = useDeleteWorkOrderMutation();

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

  const labelCtx = useMemo(
    () => ({
      factoryName: (id: number) => factories.find((f) => f.id === id)?.name ?? `Factory #${id}`,
      machineName,
    }),
    [factories, machineName],
  );

  const templateById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );

  const programOrdersForPage = useRecurrenceProgramOrdersForSheet(bundles);

  const programSummariesByWorkOrderId = useMemo(() => {
    const ordersById = new Map<number, WorkOrder>();
    for (const order of flattenSheetBundlesToOrders(bundles)) {
      ordersById.set(order.id, order);
    }
    for (const order of programOrdersForPage) {
      ordersById.set(order.id, order);
    }
    return buildProgramSummariesByWorkOrderId({
      allOrders: Array.from(ordersById.values()),
      templateById,
    });
  }, [bundles, programOrdersForPage, templateById]);

  const slotCheckOrders = useMemo(
    () => flattenSheetBundlesToOrders(bundles),
    [bundles],
  );

  const listSheetRows = useMemo(
    () => flattenSheetBundles(bundles, machineName, accountName, sheetLabelCtx, templateById),
    [bundles, machineName, accountName, sheetLabelCtx, templateById],
  );

  const combinedListRows = listSheetRows;

  const groupedDays = useMemo(() => {
    if (!applyDateFilter || !filters.sheetDate) return [];
    const groups = buildSheetDateGroups(
      listSheetRows,
      filters.dateScope,
      filters.sheetDate,
    );
    return sheetDateGroupsToWeekDayCells(groups);
  }, [
    applyDateFilter,
    filters.sheetDate,
    filters.dateScope,
    listSheetRows,
  ]);

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

  const needsSelectedOrderFetch =
    selectedOrderId != null && !orderById.has(selectedOrderId);
  const { data: fetchedSelectedOrder } = useGetWorkOrderByIdQuery(selectedOrderId!, {
    skip: !needsSelectedOrderFetch,
  });

  const selectedOrder =
    (selectedOrderId != null ? orderById.get(selectedOrderId) : undefined) ??
    fetchedSelectedOrder ??
    null;

  useEffect(() => {
    const maxPage = sheetPageCount(sheetTotal);
    if (sheetPage > maxPage) {
      setSheetPage(maxPage);
    }
  }, [sheetTotal, sheetPage, setSheetPage]);

  const showLargeTotalWarning =
    !applyDateFilter && sheetTotal > API_LIMITS.WORK_ORDERS_SHEET_LARGE_TOTAL_WARNING;

  const showBoundedPeriodCapWarning =
    applyDateFilter &&
    (dateViewMode === 'week' || dateViewMode === 'day') &&
    sheetTotal > API_LIMITS.WORK_ORDERS_SHEET_PAGE_MAX;

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

  const handleLocationFilterChange = setLocationFilterSlice;

  useEffect(() => {
    const rawOrder = searchParams.get('orderId');
    if (rawOrder) {
      const parsed = Number(rawOrder);
      if (!Number.isNaN(parsed)) {
        setSelectedOrderId(parsed);
      }
    }
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
        onManagePresetsPrograms={() => setTemplatesManagerOpen(true)}
        onManageRecurringPrograms={() => setRecurringProgramsOpen(true)}
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

      {!selectedOrder ? (
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
          showCompleteOrders={filters.showCompleteOrders}
          onShowCompleteOrdersChange={setShowCompleteOrders}
          orderCountByDate={orderCountByDate}
          calendarMonth={pickerCalendarMonth}
          onCalendarMonthChange={setPickerCalendarMonth}
          machineFilter={resolvedMachineFilter}
          onMachineChange={setMachineFilter}
          machineSelectDisabled={defaultMachineId != null}
          factoryFilter={filters.factoryFilter}
          sectionFilter={filters.sectionFilter}
          machines={machinesForToolbarSelect}
          factories={factories}
          sections={sections}
        />
      ) : null}

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
            onNavigateToOrder={(id) => setSelectedOrder(id)}
          />
        ) : applyDateFilter ? (
          <div className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {showBoundedPeriodCapWarning ? (
                <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  {sheetTotal.toLocaleString()} work orders this period — showing the first{' '}
                  {API_LIMITS.WORK_ORDERS_SHEET_PAGE_MAX}. Narrow machine or filters, or switch to
                  All dates for paging.
                </p>
              ) : null}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <WorkOrderWeekRows
                  days={groupedDays}
                  onSelectDay={handleSelectDay}
                  onAddForDay={handleAddForDay}
                  onRowClick={(id) => setSelectedOrder(id)}
                  currentUserId={user?.id ?? null}
                  onSheetMutated={refetch}
                  programSummariesByWorkOrderId={programSummariesByWorkOrderId}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden p-2">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {showLargeTotalWarning ? (
                <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  {sheetTotal.toLocaleString()} work orders match — showing page {sheetPage} of{' '}
                  {sheetPageCount(sheetTotal)}. Narrow date or filters to load faster.
                </p>
              ) : null}
              <WorkOrderSheetTable
                rows={combinedListRows}
                isLoading={isLoading || isFetching}
                showStartDateColumn
                currentUserId={user?.id ?? null}
                onSheetMutated={refetch}
                onRowClick={(id) => setSelectedOrder(id)}
                programSummariesByWorkOrderId={programSummariesByWorkOrderId}
                emptyActions={listEmptyActions}
                emptyMessage={
                  filters.statusFilter === 'planned'
                    ? 'No upcoming draft work orders match these filters.'
                    : undefined
                }
              />
              <WorkOrdersSheetPagination
                page={sheetPage}
                total={sheetTotal}
                isFetching={isFetching}
                onPageChange={setSheetPage}
              />
            </div>
          </div>
        )}
      </div>

      {!selectedOrder && footerDrawerOpen ? (
        <SheetLogEntryFooter
          ref={footerRef}
          key={`footer-${sectionId ?? 'none'}-${defaultMachineId ?? 'none'}`}
          open
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
          slotCheckOrders={slotCheckOrders}
          onSuccess={() => refetch()}
          onRequestFactorySelect={promptFactorySelect}
        />
      ) : null}

      <WorkOrderTemplateSelectorDialog
        open={templatesManagerOpen}
        onOpenChange={setTemplatesManagerOpen}
        mode="manage"
        factoryId={resolvedFactoryId}
        machineId={machineId ?? null}
        defaultSectionId={sectionId ?? null}
        defaultMachineId={defaultMachineId ?? null}
        machines={machinesInScope}
        sections={sections}
      />

      <RecurringProgramsManagerDialog
        open={recurringProgramsOpen}
        onOpenChange={setRecurringProgramsOpen}
        factoryId={resolvedFactoryId}
        machineId={machineId ?? null}
        machines={machinesInScope}
        sections={sections}
        onProgramsChanged={refetch}
        onOpenWorkOrder={(id) => setSelectedOrder(id)}
      />
    </div>
  );
};

export default WorkOrdersUnifiedView;
