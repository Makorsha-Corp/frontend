import { format } from 'date-fns';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import {
  priorityLabel,
  workOrderStatusLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import type {
  WorkOrdersFilterState,
  WorkOrdersLayoutMode,
} from './useWorkOrdersFilters';

export interface WorkOrderFilterChip {
  id: string;
  label: string;
}

export interface WorkOrderFilterChipHandlers {
  onClearFactory: () => void;
  onClearSection: () => void;
  onClearMachine: () => void;
  onClearStatus: () => void;
  onClearWorkType: () => void;
  onClearPriority: () => void;
  onClearSearch: () => void;
  onClearDate: () => void;
}

export function countActiveWorkOrderFilters(
  filters: WorkOrdersFilterState,
  layoutMode: WorkOrdersLayoutMode,
): number {
  let n = 0;
  if (filters.factoryFilter !== 'all') n += 1;
  if (filters.sectionFilter !== 'all') n += 1;
  if (filters.machineFilter !== 'all') n += 1;
  if (filters.statusFilter !== 'all') n += 1;
  if (filters.workTypeFilter !== 'all') n += 1;
  if (filters.priorityFilter !== 'all') n += 1;
  if (filters.searchQuery.trim()) n += 1;
  if (layoutMode === 'week' && filters.hasDateFilter) n += 1;
  return n;
}

export function buildWorkOrderFilterChips(
  filters: WorkOrdersFilterState,
  layoutMode: WorkOrdersLayoutMode,
  factories: Factory[],
  sections: FactorySection[],
  machines: Machine[],
  workOrderTypes: WorkOrderType[],
  handlers: WorkOrderFilterChipHandlers,
): { chip: WorkOrderFilterChip; onRemove: () => void }[] {
  const chips: { chip: WorkOrderFilterChip; onRemove: () => void }[] = [];

  if (filters.factoryFilter !== 'all') {
    const name = factories.find((f) => f.id === Number(filters.factoryFilter))?.name;
    chips.push({
      chip: { id: 'factory', label: name ?? `Factory #${filters.factoryFilter}` },
      onRemove: handlers.onClearFactory,
    });
  }
  if (filters.sectionFilter !== 'all') {
    const name = sections.find((s) => s.id === Number(filters.sectionFilter))?.name;
    chips.push({
      chip: { id: 'section', label: name ?? `Section #${filters.sectionFilter}` },
      onRemove: handlers.onClearSection,
    });
  }
  if (filters.machineFilter !== 'all') {
    const name = machines.find((m) => m.id === Number(filters.machineFilter))?.name;
    chips.push({
      chip: { id: 'machine', label: name ?? `Machine #${filters.machineFilter}` },
      onRemove: handlers.onClearMachine,
    });
  }
  if (filters.statusFilter !== 'all') {
    chips.push({
      chip: { id: 'status', label: workOrderStatusLabel(filters.statusFilter) },
      onRemove: handlers.onClearStatus,
    });
  }
  if (filters.workTypeFilter !== 'all') {
    const name = workOrderTypes.find((t) => t.id === filters.workTypeFilter)?.name;
    chips.push({
      chip: { id: 'type', label: name ?? `Type #${filters.workTypeFilter}` },
      onRemove: handlers.onClearWorkType,
    });
  }
  if (filters.priorityFilter !== 'all') {
    chips.push({
      chip: { id: 'priority', label: priorityLabel(filters.priorityFilter) },
      onRemove: handlers.onClearPriority,
    });
  }
  if (filters.searchQuery.trim()) {
    chips.push({
      chip: { id: 'search', label: `Search: ${filters.searchQuery.trim()}` },
      onRemove: handlers.onClearSearch,
    });
  }
  if (layoutMode === 'week' && filters.hasDateFilter && filters.sheetDate) {
    chips.push({
      chip: {
        id: 'date',
        label: format(new Date(`${filters.sheetDate}T12:00:00`), 'dd.MM.yyyy'),
      },
      onRemove: handlers.onClearDate,
    });
  }

  return chips;
}

/** Panel chips — excludes scope controls shown elsewhere (header breadcrumb, toolbar). */
export function buildWorkOrderPanelFilterChips(
  filters: WorkOrdersFilterState,
  factories: Factory[],
  sections: FactorySection[],
  machines: Machine[],
  workOrderTypes: WorkOrderType[],
  handlers: WorkOrderFilterChipHandlers,
): { chip: WorkOrderFilterChip; onRemove: () => void }[] {
  return buildWorkOrderFilterChips(
    filters,
    'list',
    factories,
    sections,
    machines,
    workOrderTypes,
    handlers,
  ).filter(
    ({ chip }) =>
      chip.id !== 'factory' &&
      chip.id !== 'section' &&
      chip.id !== 'machine' &&
      chip.id !== 'date',
  );
}

export function filterMachinesForWorkOrderScope(
  machines: Machine[],
  sections: FactorySection[],
  factoryFilter: string,
  sectionFilter: string,
): Machine[] {
  return machines.filter((m) => {
    if (sectionFilter !== 'all' && m.factory_section_id !== Number(sectionFilter)) return false;
    if (factoryFilter !== 'all') {
      const sec = sections.find((s) => s.id === m.factory_section_id);
      return sec?.factory_id === Number(factoryFilter);
    }
    return true;
  });
}

export function hasWorkOrderScopeFilter(
  filters: WorkOrdersFilterState,
  defaultMachineId?: number | null,
): boolean {
  return (
    filters.factoryFilter !== 'all' ||
    filters.sectionFilter !== 'all' ||
    filters.machineFilter !== 'all' ||
    defaultMachineId != null
  );
}
