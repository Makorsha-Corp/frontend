import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useGetWorkOrdersSheetQuery } from '@/features/workOrders/workOrdersApi';
import {
  useGetWorkOrderSchedulesQuery,
  useStageWorkOrderDayMutation,
  useConfirmWorkOrderScheduleMutation,
  useCancelWorkOrderScheduleMutation,
} from '@/features/workOrderSchedules/workOrderSchedulesApi';
import { useGetWorkOrderTemplatesQuery } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import { API_LIMITS } from '@/constants/apiLimits';
import { cn } from '@/lib/utils';
import MachineWorkOrderSheetTable from './MachineWorkOrderSheetTable';
import LubricantSummaryPanel from './LubricantSummaryPanel';
import SheetLogEntryFooter from './SheetLogEntryFooter';
import SheetLogEntryDialog from './SheetLogEntryDialog';
import SheetWorkOrderPreviewDialog from './SheetWorkOrderPreviewDialog';
import SheetWorkOrderDetailPanel from './SheetWorkOrderDetailPanel';
import WorkOrdersFilterStrip from './WorkOrdersFilterStrip';
import { useWorkOrdersFilters } from '@/pages/newpages/orders/useWorkOrdersFilters';
import {
  flattenSheetBundles,
  computeLubricantRollup,
} from '@/pages/newpages/orders/workOrderSheetData';
import { buildMachineIdToFactoryId } from '@/pages/newpages/orders/ordersOverviewData';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type { WorkOrder } from '@/types/workOrder';
import toast from 'react-hot-toast';

export interface WorkOrdersSheetViewProps {
  defaultMachineId?: number | null;
  onSelectWorkOrder?: (id: number) => void;
}

const WorkOrdersSheetView: React.FC<WorkOrdersSheetViewProps> = ({
  defaultMachineId,
}) => {
  const {
    filters,
    sheetRowFlow,
    apiDateFrom,
    apiDateTo,
    setDateScope,
    setSheetDate,
    setSheetRowFlow,
    setFactoryFilter,
    setSectionFilter,
    setMachineFilter,
  } = useWorkOrdersFilters();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editWorkOrderId, setEditWorkOrderId] = useState<number | undefined>();
  const [prefilledMachineId, setPrefilledMachineId] = useState<number | null>(null);
  const [footerDrawerOpen, setFooterDrawerOpen] = useState(false);
  const [sidePanelOrder, setSidePanelOrder] = useState<WorkOrder | null>(null);
  const [previewWorkOrderId, setPreviewWorkOrderId] = useState<number | null>(null);

  const factoryId = filters.factoryFilter !== 'all' ? Number(filters.factoryFilter) : undefined;
  const sectionId = filters.sectionFilter !== 'all' ? Number(filters.sectionFilter) : undefined;
  const machineId =
    defaultMachineId ??
    (filters.machineFilter !== 'all' ? Number(filters.machineFilter) : undefined);

  const { data: bundles = [], isLoading, refetch: refetchSheet } = useGetWorkOrdersSheetQuery({
    factory_id: factoryId,
    machine_id: machineId,
    start_date_from: apiDateFrom,
    start_date_to: apiDateTo,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const { data: schedules = [], isLoading: isLoadingSchedules, refetch: refetchSchedules } = useGetWorkOrderSchedulesQuery({
    factory_id: factoryId,
    machine_id: machineId,
    start_date_from: apiDateFrom,
    start_date_to: apiDateTo,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const [stageDay, { isLoading: isStaging }] = useStageWorkOrderDayMutation();
  const [confirmSchedule, { isLoading: isConfirming }] = useConfirmWorkOrderScheduleMutation();
  const [cancelSchedule, { isLoading: isCancelling }] = useCancelWorkOrderScheduleMutation();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const refetch = useCallback(() => {
    refetchSheet();
    refetchSchedules();
  }, [refetchSheet, refetchSchedules]);

  const bundlesHaveItems = useMemo(
    () => bundles.some((bundle) => bundle.items.length > 0),
    [bundles],
  );

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: sections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: templates = [] } = useGetWorkOrderTemplatesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000, is_active: true });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { workspace } = useAppSelector((s) => s.auth);
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !workspace?.id });
  const { data: inventory = [] } = useGetInventoryListQuery(
    { factory_id: factoryId, inventory_type: 'STORAGE', limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !factoryId || !bundlesHaveItems },
  );

  const machineIdToFactoryId = useMemo(
    () => buildMachineIdToFactoryId(machines, sections),
    [machines, sections],
  );

  const machineName = (id: number | null) =>
    id ? machines.find((m) => m.id === id)?.name ?? `Machine #${id}` : '—';

  const accountName = (id: number | null) =>
    id ? accounts.find((a) => a.id === id)?.name ?? null : null;

  const rows = useMemo(
    () => flattenSheetBundles(bundles, machineName, accountName),
    [bundles, machines, accounts],
  );

  const orderById = useMemo(() => {
    const map = new Map<number, WorkOrder>();
    for (const bundle of bundles) map.set(bundle.order.id, bundle.order);
    return map;
  }, [bundles]);

  const stockByItemId = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of inventory) {
      map.set(row.item_id, (map.get(row.item_id) ?? 0) + Number(row.qty));
    }
    return map;
  }, [inventory]);

  const partsInViewLines = useMemo(
    () => computeLubricantRollup(bundles, stockByItemId),
    [bundles, stockByItemId],
  );

  const hasPartsInView = partsInViewLines.length > 0;

  const machinesInScope = useMemo(() => {
    let list = machines;
    if (sectionId) list = list.filter((m) => m.factory_section_id === sectionId);
    if (factoryId) list = list.filter((m) => machineIdToFactoryId.get(m.id) === factoryId);
    if (machineId) list = list.filter((m) => m.id === machineId);
    return list;
  }, [machines, sectionId, factoryId, machineId, machineIdToFactoryId]);

  const resolvedFactoryId = factoryId ?? (defaultMachineId
    ? machineIdToFactoryId.get(defaultMachineId) ?? null
    : null);

  const showStageDay = sectionId != null;

  const footerRef = useRef<HTMLDivElement>(null);

  const focusFooterForLog = useCallback((machineIdForPrefill?: number | null) => {
    setPrefilledMachineId(machineIdForPrefill ?? defaultMachineId ?? null);
    setFooterDrawerOpen(true);
    requestAnimationFrame(() => {
      footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [defaultMachineId]);

  const openEditDialog = useCallback((workOrderId: number) => {
    setEditWorkOrderId(workOrderId);
    setEditDialogOpen(true);
  }, []);

  const handleRowClick = useCallback((workOrderId: number) => {
    if (sheetRowFlow === 'modal-edit') {
      openEditDialog(workOrderId);
      return;
    }
    if (sheetRowFlow === 'side-panel') {
      const order = orderById.get(workOrderId);
      if (order) setSidePanelOrder(order);
      return;
    }
    if (sheetRowFlow === 'preview') {
      setPreviewWorkOrderId(workOrderId);
    }
  }, [sheetRowFlow, openEditDialog, orderById]);

  const handleStageDay = async () => {
    try {
      const result = await stageDay({
        target_date: filters.sheetDate,
        factory_section_id: sectionId ?? undefined,
        factory_id: resolvedFactoryId ?? undefined,
      }).unwrap();
      toast.success(result.length > 0 ? `Staged ${result.length} order(s)` : 'No new orders to stage');
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to stage day');
    }
  };

  const handleConfirmSchedule = async (scheduleId: number) => {
    setConfirmingId(scheduleId);
    try {
      await confirmSchedule(scheduleId).unwrap();
      toast.success('Work order created (draft)');
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to confirm schedule');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancelSchedule = async (scheduleId: number) => {
    setCancellingId(scheduleId);
    try {
      await cancelSchedule(scheduleId).unwrap();
      toast.success('Schedule cancelled');
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to cancel schedule');
    } finally {
      setCancellingId(null);
    }
  };

  const showSidePanel = sheetRowFlow === 'side-panel' && sidePanelOrder != null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <WorkOrdersFilterStrip
        showHubFilters={false}
        sheetRowFlow={sheetRowFlow}
        onSheetRowFlowChange={setSheetRowFlow}
        dateScope={filters.dateScope}
        sheetDate={filters.sheetDate}
        onDateScopeChange={setDateScope}
        onSheetDateChange={setSheetDate}
        statusFilter={filters.statusFilter}
        workTypeFilter={filters.workTypeFilter}
        priorityFilter={filters.priorityFilter}
        factoryFilter={filters.factoryFilter}
        sectionFilter={filters.sectionFilter}
        machineFilter={defaultMachineId ? String(defaultMachineId) : filters.machineFilter}
        searchQuery={filters.searchQuery}
        onStatusChange={() => {}}
        onWorkTypeChange={() => {}}
        onPriorityChange={() => {}}
        onFactoryChange={setFactoryFilter}
        onSectionChange={setSectionFilter}
        onMachineChange={setMachineFilter}
        onSearchChange={() => {}}
        factories={factories}
        sections={sections}
        machines={machines}
        workOrderTypes={workOrderTypes}
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-row overflow-hidden rounded-lg border border-border bg-card shadow-sm',
            hasPartsInView && !showSidePanel ? 'flex-[0_0_70%]' : 'min-w-0 flex-1',
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <MachineWorkOrderSheetTable
              rows={rows}
              schedules={schedules}
              dateScope={filters.dateScope}
              sheetDate={filters.sheetDate}
              onSheetDateChange={setSheetDate}
              isLoading={isLoading || isLoadingSchedules}
              onRowClick={handleRowClick}
              onLogEntry={() => focusFooterForLog()}
              onStageDay={handleStageDay}
              onConfirmSchedule={handleConfirmSchedule}
              onCancelSchedule={handleCancelSchedule}
              isStagingDay={isStaging}
              isConfirmingScheduleId={isConfirming ? confirmingId : null}
              isCancellingScheduleId={isCancelling ? cancellingId : null}
              showStageDay={showStageDay}
            />
          </div>
          {showSidePanel && sidePanelOrder && (
            <SheetWorkOrderDetailPanel
              order={sidePanelOrder}
              onClose={() => setSidePanelOrder(null)}
              onDelete={() => {
                setSidePanelOrder(null);
                refetch();
              }}
            />
          )}
        </div>

        {hasPartsInView && (
          <LubricantSummaryPanel
            className={cn('min-w-0 flex-[0_0_30%]')}
            lines={partsInViewLines}
            isLoading={isLoading}
          />
        )}
      </div>

      <SheetLogEntryFooter
        ref={footerRef}
        key={`footer-${sectionId ?? 'none'}-${prefilledMachineId ?? 'none'}`}
        open={footerDrawerOpen}
        onOpenChange={setFooterDrawerOpen}
        sheetDate={filters.sheetDate}
        factoryId={resolvedFactoryId}
        sectionId={sectionId ?? null}
        machines={machinesInScope}
        workOrderTypes={workOrderTypes}
        partItems={items}
        templates={templates}
        accounts={accounts}
        members={members}
        defaultMachineId={prefilledMachineId ?? defaultMachineId}
        onSuccess={() => refetch()}
      />

      {editDialogOpen && editWorkOrderId != null && (
        <SheetLogEntryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          workOrderId={editWorkOrderId}
          sheetDate={filters.sheetDate}
          factoryId={resolvedFactoryId}
          sectionId={sectionId ?? null}
          machines={machinesInScope}
          workOrderTypes={workOrderTypes}
          partItems={items}
          templates={templates}
          accounts={accounts}
          members={members}
          onSuccess={() => refetch()}
        />
      )}

      {previewWorkOrderId != null && (
        <SheetWorkOrderPreviewDialog
          open={previewWorkOrderId != null}
          onOpenChange={(open) => !open && setPreviewWorkOrderId(null)}
          rows={rows}
          workOrderId={previewWorkOrderId}
          onEdit={() => openEditDialog(previewWorkOrderId)}
        />
      )}
    </div>
  );
};

export default WorkOrdersSheetView;
