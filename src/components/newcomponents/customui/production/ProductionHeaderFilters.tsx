import React, { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import type { ProductionBatchStatus } from '@/components/newcomponents/customui/production/ProductionContextFilters';
import ProductionActivityRecipeFilter from '@/components/newcomponents/customui/production/ProductionActivityRecipeFilter';
import ProductionOverviewDateRangeFilter from '@/components/newcomponents/customui/production/ProductionOverviewDateRangeFilter';
import ProductionBatchStatusFilter from '@/components/newcomponents/customui/production/ProductionBatchStatusFilter';
import ProductionRunsLineFilter from '@/components/newcomponents/customui/production/ProductionRunsLineFilter';
import WorkOrdersMachineFilter from '@/components/newcomponents/customui/orders/WorkOrdersMachineFilter';
import type { ProductionPageTab } from '@/components/newcomponents/customui/production/ProductionPageHeaderTabs';
import { countProductionHeaderFilters } from '@/components/newcomponents/customui/production/productionHeaderFilterHelpers';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import type { ProductionFormula, ProductionLine } from '@/types/production';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

export interface ProductionHeaderFiltersProps {
  activeTab: ProductionPageTab;
  lines: ProductionLine[];
  selectedLineIds: number[];
  onSelectedLineIdsChange: (lineIds: number[]) => void;
  batchDateFrom: string | null;
  batchDateTo: string | null;
  onBatchDateRangeApply: (from: string | null, to: string | null) => void;
  batchStatusFilter: ProductionBatchStatus[];
  batchStatusViewMode: WorkOrdersDateViewMode | 'all';
  showCompletedBatches: boolean;
  onBatchStatusFilterApply: (
    filter: ProductionBatchStatus[],
    showCompleted: boolean,
  ) => void;
  activityFormulaIds: number[];
  onActivityFormulaIdsChange: (ids: number[]) => void;
  formulas: ProductionFormula[];
  runsMachine: string;
  onRunsMachineChange: (value: string) => void;
  machines: Machine[];
  factories: Factory[];
  sections: FactorySection[];
  factoryFilter: string;
}

const ProductionHeaderFilters: React.FC<ProductionHeaderFiltersProps> = ({
  activeTab,
  lines,
  selectedLineIds,
  onSelectedLineIdsChange,
  batchDateFrom,
  batchDateTo,
  onBatchDateRangeApply,
  batchStatusFilter,
  batchStatusViewMode,
  showCompletedBatches,
  onBatchStatusFilterApply,
  activityFormulaIds,
  onActivityFormulaIdsChange,
  formulas,
  runsMachine,
  onRunsMachineChange,
  machines,
  factories,
  sections,
  factoryFilter,
}) => {
  const filterCount = useMemo(
    () =>
      countProductionHeaderFilters({
        activeTab,
        lines,
        selectedLineIds,
        batchDateFrom,
        batchDateTo,
        batchStatusFilter,
        batchStatusViewMode,
        activityFormulaIds,
        runsMachine,
      }),
    [
      activeTab,
      lines,
      selectedLineIds,
      batchDateFrom,
      batchDateTo,
      batchStatusFilter,
      batchStatusViewMode,
      activityFormulaIds,
      runsMachine,
    ],
  );

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={filterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          className={cn('shrink-0 gap-1.5', appShellHeaderControlClass)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filterCount > 0 ? (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
              {filterCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(20rem,94vw)] p-0"
        onCloseAutoFocus={preventRadixCloseAutoFocus}
      >
        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Production lines
            </p>
            <ProductionRunsLineFilter
              lines={lines}
              selectedLineIds={selectedLineIds}
              onSelectedLineIdsChange={onSelectedLineIdsChange}
              className="w-full [&_button]:max-w-none"
            />
          </div>

          {activeTab === 'overview' ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date range
                </p>
                <ProductionOverviewDateRangeFilter
                  batchDateFrom={batchDateFrom}
                  batchDateTo={batchDateTo}
                  onBatchDateRangeApply={onBatchDateRangeApply}
                  className="w-full [&_button]:max-w-none"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <ProductionBatchStatusFilter
                  batchStatusFilter={batchStatusFilter}
                  batchStatusViewMode={batchStatusViewMode}
                  showCompletedBatches={showCompletedBatches}
                  onBatchStatusFilterApply={onBatchStatusFilterApply}
                  className="w-full [&_button]:max-w-none"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity recipes
                </p>
                <ProductionActivityRecipeFilter
                  formulas={formulas}
                  selectedFormulaIds={activityFormulaIds}
                  onSelectedFormulaIdsChange={onActivityFormulaIdsChange}
                  className="w-full [&_button]:max-w-none"
                />
              </div>
            </>
          ) : null}

          {activeTab === 'batches' ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <ProductionBatchStatusFilter
                  batchStatusFilter={batchStatusFilter}
                  batchStatusViewMode={batchStatusViewMode}
                  showCompletedBatches={showCompletedBatches}
                  onBatchStatusFilterApply={onBatchStatusFilterApply}
                  className="w-full [&_button]:max-w-none"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Machine
                </p>
                <WorkOrdersMachineFilter
                  machineFilter={runsMachine}
                  onMachineChange={onRunsMachineChange}
                  factoryFilter={factoryFilter}
                  sectionFilter="all"
                  machines={machines}
                  factories={factories}
                  sections={sections}
                  className="w-full [&_button]:max-w-none"
                />
              </div>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductionHeaderFilters;
