import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import WorkOrdersMachineFilter from '@/components/newcomponents/customui/orders/WorkOrdersMachineFilter';
import {
  BATCH_STATUS_POPOVER_ORDER,
  type ProductionBatchStatus,
  batchStatusCheckboxChecked,
  batchStatusFilterRowHint,
  isDefaultBatchStatusFilter,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';

export interface ProductionRunsFilterPanelProps {
  machineFilter: string;
  onMachineChange: (value: string) => void;
  machines: Machine[];
  factories: Factory[];
  sections: FactorySection[];
  factoryFilter: string;
  sectionFilter: string;
  batchStatusFilter: ProductionBatchStatus[];
  batchStatusDateViewMode?: WorkOrdersDateViewMode;
  onToggleBatchStatus: (status: ProductionBatchStatus) => void;
  onClearBatchStatusFilter: () => void;
  showCompletedBatches: boolean;
  onShowCompletedBatchesChange: (value: boolean) => void;
}

export function countProductionRunsPopoverFilters(
  machineFilter: string,
  batchStatusFilter: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): number {
  let count = 0;
  if (machineFilter !== 'all') count += 1;
  if (!isDefaultBatchStatusFilter(batchStatusFilter, dateViewMode)) count += 1;
  return count;
}

const ProductionRunsFilterPanel: React.FC<ProductionRunsFilterPanelProps> = ({
  machineFilter,
  onMachineChange,
  machines,
  factories,
  sections,
  factoryFilter,
  sectionFilter,
  batchStatusFilter,
  batchStatusDateViewMode,
  onToggleBatchStatus,
  onClearBatchStatusFilter,
  showCompletedBatches,
  onShowCompletedBatchesChange,
}) => {
  const renderStatusRow = (s: ProductionBatchStatus) => {
    const isCompleted = s === 'completed';
    const isCancelled = s === 'cancelled';
    const checked = isCompleted
      ? showCompletedBatches
      : batchStatusCheckboxChecked(batchStatusFilter, s, batchStatusDateViewMode);
    const hint = batchStatusFilterRowHint(s, batchStatusDateViewMode);
    const row = (
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50"
        onClick={() => {
          if (isCompleted) onShowCompletedBatchesChange(!showCompletedBatches);
          else onToggleBatchStatus(s);
        }}
      >
        <Checkbox
          checked={checked}
          tabIndex={-1}
          className={cn(
            'pointer-events-none',
            isCompleted &&
              'data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white',
            isCancelled &&
              'data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white',
          )}
          aria-hidden
        />
        <span className="capitalize">{s.replace('_', ' ')}</span>
      </button>
    );
    if (!hint) return row;
    return (
      <Tooltip key={s}>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-[14rem] text-xs leading-snug">
          {hint}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
  <TooltipProvider delayDuration={300}>
  <div className="space-y-3 p-3">
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Machine</p>
      <WorkOrdersMachineFilter
        machineFilter={machineFilter}
        onMachineChange={onMachineChange}
        factoryFilter={factoryFilter}
        sectionFilter={sectionFilter}
        machines={machines}
        factories={factories}
        sections={sections}
        className="w-full [&_button]:max-w-none"
      />
    </div>
    <Separator />
    <div className="space-y-1">
      <button
        type="button"
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
        onClick={onClearBatchStatusFilter}
      >
        Reset status filters
      </button>
      {BATCH_STATUS_POPOVER_ORDER.map((s) => (
        <React.Fragment key={s}>{renderStatusRow(s)}</React.Fragment>
      ))}
    </div>
  </div>
  </TooltipProvider>
  );
};

export default ProductionRunsFilterPanel;
