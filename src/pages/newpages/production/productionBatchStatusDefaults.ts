import {
  stripCompletedFromStatusFilter,
  viewDefaultBatchStatusFilter,
  type ProductionBatchStatus,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';

function statusSetEqual(a: ProductionBatchStatus[], b: ProductionBatchStatus[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((status) => setA.has(status));
}

/**
 * Store `[]` when the selection matches the open view's default.
 * Any other mix is custom and stays put across All dates, week, and day.
 */
export function persistedBatchStatusFilter(
  next: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): ProductionBatchStatus[] {
  const stripped = stripCompletedFromStatusFilter(next);
  if (stripped.length === 0) return [];
  if (statusSetEqual(stripped, viewDefaultBatchStatusFilter(dateViewMode))) return [];
  return stripped;
}
