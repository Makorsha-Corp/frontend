import {
  isDefaultBatchStatusFilter,
  type ProductionBatchStatus,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import {
  isAllProductionLinesSelected,
  isProductionRunsLineFilterDefault,
} from '@/components/newcomponents/customui/production/productionRunsLineFilterUtils';
import type { ProductionPageTab } from '@/components/newcomponents/customui/production/ProductionPageHeaderTabs';
import type { ProductionLine } from '@/types/production';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { isDefaultActivityRecipeFilter } from '@/lib/productionActivityRecipeFilter';

export function countProductionHeaderFilters(args: {
  activeTab: ProductionPageTab;
  lines: ProductionLine[];
  selectedLineIds: number[];
  batchDateFrom: string | null;
  batchDateTo: string | null;
  batchStatusFilter: ProductionBatchStatus[];
  batchStatusViewMode: WorkOrdersDateViewMode | 'all';
  activityFormulaIds: number[];
  runsMachine: string;
}): number {
  let count = 0;
  if (
    args.lines.length > 0 &&
    !isProductionRunsLineFilterDefault(args.selectedLineIds, args.lines)
  ) {
    count += 1;
  }

  const statusViewMode =
    args.batchStatusViewMode === 'all' ? undefined : args.batchStatusViewMode;

  if (args.activeTab === 'overview') {
    if (args.batchDateFrom || args.batchDateTo) count += 1;
    if (!isDefaultBatchStatusFilter(args.batchStatusFilter, statusViewMode)) {
      count += 1;
    }
    if (!isDefaultActivityRecipeFilter(args.activityFormulaIds)) count += 1;
    return count;
  }

  if (args.activeTab === 'batches') {
    if (!isDefaultBatchStatusFilter(args.batchStatusFilter, statusViewMode)) {
      count += 1;
    }
    if (args.runsMachine !== 'all') count += 1;
    return count;
  }

  return count;
}

export function batchesInLineScope<T extends { production_line_id: number }>(
  rows: T[],
  lines: ProductionLine[],
  selectedLineIds: number[],
): T[] {
  if (lines.length === 0) return rows;
  if (isAllProductionLinesSelected(selectedLineIds, lines)) return rows;
  if (selectedLineIds.length === 0) return [];
  const allowed = new Set(selectedLineIds);
  return rows.filter((row) => allowed.has(row.production_line_id));
}

export function linesInLineScope(
  lines: ProductionLine[],
  selectedLineIds: number[],
): ProductionLine[] {
  if (lines.length === 0) return lines;
  if (isAllProductionLinesSelected(selectedLineIds, lines)) return lines;
  if (selectedLineIds.length === 0) return [];
  const allowed = new Set(selectedLineIds);
  return lines.filter((line) => allowed.has(line.id));
}
