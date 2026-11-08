import {
  BATCH_STATUS_POPOVER_ORDER,
  type ProductionBatchStatus,
  batchStatusCheckboxChecked,
  isDefaultBatchStatusFilter,
  viewDefaultBatchStatusFilter,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';

export type BatchStatusDraftKey = ProductionBatchStatus;

export function batchStatusFilterToDraftChecked(
  filter: ProductionBatchStatus[],
  showCompleted: boolean,
  dateViewMode?: WorkOrdersDateViewMode,
): Set<BatchStatusDraftKey> {
  const checked = new Set<BatchStatusDraftKey>();
  for (const status of BATCH_STATUS_POPOVER_ORDER) {
    if (status === 'completed') {
      if (showCompleted) checked.add(status);
      continue;
    }
    if (batchStatusCheckboxChecked(filter, status, dateViewMode)) {
      checked.add(status);
    }
  }
  return checked;
}

export function draftCheckedToBatchStatusFilter(
  checked: Set<BatchStatusDraftKey>,
  dateViewMode?: WorkOrdersDateViewMode,
): { filter: ProductionBatchStatus[]; showCompleted: boolean } {
  const showCompleted = checked.has('completed');
  const statuses = BATCH_STATUS_POPOVER_ORDER.filter(
    (s) => s !== 'completed' && checked.has(s),
  ) as ProductionBatchStatus[];

  const viewDefault = viewDefaultBatchStatusFilter(dateViewMode);
  const matchesViewDefault =
    statuses.length === viewDefault.length && statuses.every((s) => viewDefault.includes(s));

  if (matchesViewDefault && !showCompleted) {
    return { filter: [], showCompleted: false };
  }

  return { filter: statuses, showCompleted };
}

export function productionBatchStatusFilterLabel(
  filter: ProductionBatchStatus[],
  showCompleted: boolean,
  dateViewMode?: WorkOrdersDateViewMode,
): string {
  if (isDefaultBatchStatusFilter(filter, dateViewMode) && !showCompleted) {
    return 'Default statuses';
  }
  const parts: string[] = [];
  const nonCompleted = BATCH_STATUS_POPOVER_ORDER.filter(
    (s) => s !== 'completed' && batchStatusCheckboxChecked(filter, s, dateViewMode),
  );
  if (nonCompleted.length === BATCH_STATUS_POPOVER_ORDER.length - 1) {
    parts.push('All statuses');
  } else if (nonCompleted.length === 0) {
    parts.push('No statuses');
  } else {
    parts.push(`${nonCompleted.length} statuses`);
  }
  if (showCompleted) parts.push('completed');
  return parts.join(' · ');
}

export function isDefaultBatchStatusFilterSelection(
  filter: ProductionBatchStatus[],
  showCompleted: boolean,
  dateViewMode?: WorkOrdersDateViewMode,
): boolean {
  return isDefaultBatchStatusFilter(filter, dateViewMode) && !showCompleted;
}

export function allBatchStatusesDraftChecked(): Set<BatchStatusDraftKey> {
  return new Set(BATCH_STATUS_POPOVER_ORDER);
}

export function noBatchStatusesDraftChecked(): Set<BatchStatusDraftKey> {
  return new Set();
}
