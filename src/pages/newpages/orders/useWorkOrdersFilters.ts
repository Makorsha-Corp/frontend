import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import type { WorkOrderPriorityFilter, WorkOrderStatusFilter, WorkTypeFilter } from './workOrdersOverviewData';

export type SheetDateScope = 'day' | 'week' | 'month';
export type SheetRowFlow = 'modal-edit' | 'side-panel' | 'preview';
/** @deprecated Calendar week layout removed — date filters drive grouped list instead. */
export type WorkOrdersLayoutMode = 'list' | 'week';
/** @deprecated Columns week view removed. */
export type WorkOrdersWeekView = 'rows' | 'columns';
export type DatePreset = 'today' | 'week' | 'month';
export type WorkOrdersDateViewMode = 'all' | 'week' | 'day';

export function deriveDateViewMode(
  hasDateFilter: boolean,
  dateScope: SheetDateScope,
): WorkOrdersDateViewMode {
  if (!hasDateFilter) return 'all';
  if (dateScope === 'day') return 'day';
  return 'week';
}

function parseLayoutMode(raw: string | null): WorkOrdersLayoutMode {
  return raw === 'week' ? 'week' : 'list';
}

function parseWeekView(raw: string | null): WorkOrdersWeekView {
  return raw === 'columns' ? 'columns' : 'rows';
}

export interface WorkOrdersFilterState {
  dateScope: SheetDateScope;
  /** Empty string = no date filter (show all matching orders in list mode). */
  sheetDate: string;
  hasDateFilter: boolean;
  dateRange: { from?: Date; to?: Date };
  statusFilter: WorkOrderStatusFilter;
  workTypeFilter: WorkTypeFilter;
  priorityFilter: WorkOrderPriorityFilter;
  factoryFilter: string;
  sectionFilter: string;
  machineFilter: string;
  searchQuery: string;
  showCompleteOrders: boolean;
}

const SHEET_WEEK_STARTS_ON = 0 as const;

const todayIso = () => format(new Date(), 'yyyy-MM-dd');

function parseSheetDateScope(raw: string | null): SheetDateScope {
  if (raw === 'day' || raw === 'month') return raw;
  return 'week';
}

function parseSheetRowFlow(raw: string | null): SheetRowFlow {
  if (raw === 'side-panel' || raw === 'preview') return raw;
  return 'modal-edit';
}

/** Work orders default to showing completed; URL `woShowComplete=0` hides them. */
function readWorkOrderShowComplete(params: URLSearchParams): boolean {
  const raw = params.get('woShowComplete');
  if (raw === '0' || raw === 'false') return false;
  return true;
}

export function useWorkOrdersFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const dateScope = parseSheetDateScope(searchParams.get('woDateScope'));
  const layoutMode = parseLayoutMode(searchParams.get('woLayout'));
  const weekView = parseWeekView(searchParams.get('woWeekView'));
  const sheetRowFlow = parseSheetRowFlow(searchParams.get('sheetRowFlow'));
  const sheetDate = searchParams.get('woDate') ?? '';
  const hasDateFilter = sheetDate.length > 0;
  const factoryFilter = searchParams.get('woFactory') ?? 'all';
  const sectionFilter = searchParams.get('woSection') ?? 'all';
  const machineFilter = searchParams.get('woMachine') ?? 'all';
  const statusFilter = (searchParams.get('woStatus') ?? 'all') as WorkOrderStatusFilter;
  const workTypeFilter = searchParams.get('woType') === 'all' || !searchParams.get('woType')
    ? 'all'
    : Number(searchParams.get('woType'));
  const priorityFilter = (searchParams.get('woPriority') ?? 'all') as WorkOrderPriorityFilter;
  const searchQuery = searchParams.get('woSearch') ?? '';
  const showCompleteOrders = readWorkOrderShowComplete(searchParams);

  const dateRange = useMemo(() => {
    if (!hasDateFilter) return {};
    const base = parseISO(sheetDate);
    if (dateScope === 'month') {
      return { from: startOfMonth(base), to: endOfMonth(base) };
    }
    if (dateScope === 'week') {
      return {
        from: startOfWeek(base, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
        to: endOfWeek(base, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
      };
    }
    const day = startOfDay(base);
    return { from: day, to: endOfDay(day) };
  }, [dateScope, sheetDate, hasDateFilter]);

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === '' || value === 'all') next.delete(key);
          else next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setDateScope = (scope: SheetDateScope) =>
    patchParams({ woDateScope: scope === 'week' ? null : scope });
  /** @deprecated No-op — layout toggle removed; use date filters instead. */
  const setLayoutMode = (_mode: WorkOrdersLayoutMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('woLayout');
      next.delete('woWeekView');
      return next;
    });
  };
  const setSheetRowFlow = (flow: SheetRowFlow) =>
    patchParams({ sheetRowFlow: flow === 'modal-edit' ? null : flow });
  const setWeekView = (view: WorkOrdersWeekView) =>
    patchParams({ woWeekView: view === 'rows' ? null : view });
  const setSheetDate = (iso: string) => patchParams({ woDate: iso.trim() ? iso : null });
  const clearSheetDate = () => patchParams({ woDate: null, woDateScope: null });
  const setFactoryFilter = (value: string) =>
    patchParams({ woFactory: value === 'all' ? null : value, woMachine: null });
  const setSectionFilter = (value: string) =>
    patchParams({ woSection: value === 'all' ? null : value, woMachine: null });
  const setMachineFilter = (value: string) => patchParams({ woMachine: value === 'all' ? null : value });
  const setStatusFilter = (value: WorkOrderStatusFilter) =>
    patchParams({ woStatus: value === 'all' ? null : value });
  const setWorkTypeFilter = (value: WorkTypeFilter) =>
    patchParams({ woType: value === 'all' ? null : String(value) });
  const setPriorityFilter = (value: WorkOrderPriorityFilter) =>
    patchParams({ woPriority: value === 'all' ? null : value });
  const setSearchQuery = (value: string) => patchParams({ woSearch: value.trim() ? value : null });
  const setShowCompleteOrders = (value: boolean) =>
    patchParams({ woShowComplete: value ? null : '0' });

  const dateViewMode = deriveDateViewMode(hasDateFilter, dateScope);

  const setDateViewMode = useCallback(
    (mode: WorkOrdersDateViewMode) => {
      if (mode === 'all') {
        patchParams({ woDate: null, woDateScope: null });
        return;
      }
      if (mode === 'week') {
        patchParams({ woDate: todayIso(), woDateScope: null });
        return;
      }
      patchParams({ woDate: sheetDate || todayIso(), woDateScope: 'day' });
    },
    [patchParams, sheetDate],
  );

  const pickDate = useCallback(
    (iso: string) => {
      patchParams({ woDate: iso, woDateScope: 'day' });
    },
    [patchParams],
  );

  const pickWeek = useCallback(
    (iso: string) => {
      patchParams({ woDate: iso, woDateScope: null });
    },
    [patchParams],
  );

  const shiftWeek = useCallback(
    (direction: 'prev' | 'next') => {
      if (!sheetDate || dateScope === 'day') return;
      const base = parseISO(sheetDate);
      const shifted = direction === 'prev' ? subDays(base, 7) : addDays(base, 7);
      setSheetDate(format(shifted, 'yyyy-MM-dd'));
    },
    [sheetDate, dateScope, setSheetDate],
  );

  const shiftSheetDate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!sheetDate) return;
      const base = parseISO(sheetDate);
      let shifted: Date;
      if (dateScope === 'month') {
        shifted = direction === 'prev' ? subMonths(base, 1) : addMonths(base, 1);
      } else if (dateScope === 'week') {
        shifted = direction === 'prev' ? subDays(base, 7) : addDays(base, 7);
      } else {
        shifted = direction === 'prev' ? subDays(base, 1) : addDays(base, 1);
      }
      setSheetDate(format(shifted, 'yyyy-MM-dd'));
    },
    [sheetDate, dateScope, setSheetDate],
  );

  const applyDatePreset = useCallback(
    (preset: DatePreset) => {
      const today = todayIso();
      if (preset === 'today') {
        patchParams({ woDate: today, woDateScope: 'day' });
      } else if (preset === 'week') {
        patchParams({ woDate: today, woDateScope: null });
      } else {
        patchParams({ woDate: today, woDateScope: 'month' });
      }
    },
    [patchParams],
  );

  const goToToday = useCallback(() => {
    setSheetDate(todayIso());
  }, [setSheetDate]);

  useEffect(() => {
    setSearchParams((prev) => {
      const layout = prev.get('woLayout');
      const weekViewParam = prev.get('woWeekView');
      if (!layout && !weekViewParam) return prev;
      const next = new URLSearchParams(prev);
      next.delete('woLayout');
      next.delete('woWeekView');
      if (layout === 'week' && !prev.get('woDate')) {
        next.set('woDate', todayIso());
      }
      if (prev.get('woDateScope') === 'month') {
        next.delete('woDateScope');
      }
      return next;
    });
  }, [setSearchParams]);

  const filters: WorkOrdersFilterState = {
    dateScope,
    sheetDate,
    hasDateFilter,
    dateRange,
    statusFilter,
    workTypeFilter,
    priorityFilter,
    factoryFilter,
    sectionFilter,
    machineFilter,
    searchQuery,
    showCompleteOrders,
  };

  const apiDateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const apiDateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  return {
    filters,
    dateViewMode,
    layoutMode,
    weekView,
    sheetRowFlow,
    apiDateFrom,
    apiDateTo,
    setDateScope,
    setDateViewMode,
    pickDate,
    pickWeek,
    setLayoutMode,
    setWeekView,
    setSheetRowFlow,
    setSheetDate,
    clearSheetDate,
    setFactoryFilter,
    setSectionFilter,
    setMachineFilter,
    setStatusFilter,
    setWorkTypeFilter,
    setPriorityFilter,
    setSearchQuery,
    setShowCompleteOrders,
    shiftWeek,
    shiftSheetDate,
    applyDatePreset,
    goToToday,
    patchParams,
  };
}
