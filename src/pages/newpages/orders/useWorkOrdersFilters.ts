import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { endOfDay, endOfMonth, format, parseISO, startOfDay, startOfMonth } from 'date-fns';
import type { WorkOrderPriorityFilter, WorkOrderStatusFilter, WorkTypeFilter } from './workOrdersOverviewData';

export type SheetDateScope = 'day' | 'week' | 'month';
export type SheetRowFlow = 'modal-edit' | 'side-panel' | 'preview';
export type WorkOrdersLayoutMode = 'list' | 'week';

function parseLayoutMode(raw: string | null): WorkOrdersLayoutMode {
  return raw === 'week' ? 'week' : 'list';
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
}

const todayIso = () => format(new Date(), 'yyyy-MM-dd');

function parseSheetDateScope(raw: string | null): SheetDateScope {
  if (raw === 'day' || raw === 'month') return raw;
  return 'week';
}

function parseSheetRowFlow(raw: string | null): SheetRowFlow {
  if (raw === 'side-panel' || raw === 'preview') return raw;
  return 'modal-edit';
}

export function useWorkOrdersFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const dateScope = parseSheetDateScope(searchParams.get('woDateScope'));
  const layoutMode = parseLayoutMode(searchParams.get('woLayout'));
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

  const dateRange = useMemo(() => {
    if (!hasDateFilter) return {};
    const base = parseISO(sheetDate);
    if (dateScope === 'month') {
      return { from: startOfMonth(base), to: endOfMonth(base) };
    }
    if (dateScope === 'week') {
      const from = startOfDay(base);
      const to = endOfDay(new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000));
      return { from, to };
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
  const setLayoutMode = (mode: WorkOrdersLayoutMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === 'list') {
        next.delete('woLayout');
        next.delete('woDate');
        next.delete('woDateScope');
      } else {
        next.set('woLayout', 'week');
        if (!prev.get('woDate')) {
          next.set('woDate', todayIso());
        }
      }
      return next;
    });
  };
  const setSheetRowFlow = (flow: SheetRowFlow) =>
    patchParams({ sheetRowFlow: flow === 'modal-edit' ? null : flow });
  const setSheetDate = (iso: string) => patchParams({ woDate: iso.trim() ? iso : null });
  const clearSheetDate = () => patchParams({ woDate: null });
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
  };

  const apiDateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const apiDateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  return {
    filters,
    layoutMode,
    sheetRowFlow,
    apiDateFrom,
    apiDateTo,
    setDateScope,
    setLayoutMode,
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
    patchParams,
  };
}
