import React, { useEffect, useMemo, useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  appShellHeaderBoxedControlClass,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import {
  BATCH_STATUS_POPOVER_ORDER,
  type ProductionBatchStatus,
  batchStatusFilterRowHint,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import {
  allBatchStatusesDraftChecked,
  batchStatusFilterToDraftChecked,
  draftCheckedToBatchStatusFilter,
  isDefaultBatchStatusFilterSelection,
  noBatchStatusesDraftChecked,
  productionBatchStatusFilterLabel,
  type BatchStatusDraftKey,
} from '@/lib/productionBatchStatusFilterDraft';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

export interface ProductionBatchStatusFilterProps {
  batchStatusFilter: ProductionBatchStatus[];
  batchStatusViewMode: WorkOrdersDateViewMode | 'all';
  showCompletedBatches: boolean;
  onBatchStatusFilterApply: (
    filter: ProductionBatchStatus[],
    showCompleted: boolean,
  ) => void;
  className?: string;
}

const ProductionBatchStatusFilter: React.FC<ProductionBatchStatusFilterProps> = ({
  batchStatusFilter,
  batchStatusViewMode,
  showCompletedBatches,
  onBatchStatusFilterApply,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const statusDateViewMode =
    batchStatusViewMode === 'all' ? undefined : batchStatusViewMode;

  const [draftChecked, setDraftChecked] = useState<Set<BatchStatusDraftKey>>(() =>
    batchStatusFilterToDraftChecked(
      batchStatusFilter,
      showCompletedBatches,
      statusDateViewMode,
    ),
  );

  useEffect(() => {
    if (!open) return;
    setDraftChecked(
      batchStatusFilterToDraftChecked(
        batchStatusFilter,
        showCompletedBatches,
        statusDateViewMode,
      ),
    );
  }, [open, batchStatusFilter, showCompletedBatches, statusDateViewMode]);

  const displayLabel = useMemo(
    () =>
      productionBatchStatusFilterLabel(
        batchStatusFilter,
        showCompletedBatches,
        statusDateViewMode,
      ),
    [batchStatusFilter, showCompletedBatches, statusDateViewMode],
  );

  const showClear = !isDefaultBatchStatusFilterSelection(
    batchStatusFilter,
    showCompletedBatches,
    statusDateViewMode,
  );

  const applyDraft = () => {
    const { filter, showCompleted } = draftCheckedToBatchStatusFilter(
      draftChecked,
      statusDateViewMode,
    );
    onBatchStatusFilterApply(filter, showCompleted);
    setOpen(false);
  };

  const toggleDraftStatus = (status: BatchStatusDraftKey) => {
    setDraftChecked((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleAllDraft = () => {
    setDraftChecked((prev) =>
      prev.size === BATCH_STATUS_POPOVER_ORDER.length
        ? noBatchStatusesDraftChecked()
        : allBatchStatusesDraftChecked(),
    );
  };

  const renderStatusRow = (status: ProductionBatchStatus) => {
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';
    const checked = draftChecked.has(status);
    const hint = batchStatusFilterRowHint(status, statusDateViewMode);
    const row = (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`batch-status-draft-${status}`}
          checked={checked}
          onCheckedChange={() => toggleDraftStatus(status)}
          className={cn(
            isCompleted &&
              'data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white',
            isCancelled &&
              'data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white',
          )}
        />
        <Label
          htmlFor={`batch-status-draft-${status}`}
          className="cursor-pointer font-normal capitalize"
        >
          {status.replace('_', ' ')}
        </Label>
      </div>
    );
    return (
      <li key={status}>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="left" className="max-w-[14rem] text-xs leading-snug">
              {hint}
            </TooltipContent>
          </Tooltip>
        ) : (
          row
        )}
      </li>
    );
  };

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <MachineSelectSummaryButton
            ariaLabel={`Filter by batch status. Current: ${displayLabel}`}
            selectedLine={displayLabel}
            compactLabel
            className={cn(
              appShellHeaderBoxedControlClass,
              appShellHeaderControlClass,
              'mt-0 h-9 min-h-9 max-w-[min(220px,36vw)] truncate px-2.5 text-xs sm:text-sm',
            )}
          />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(18rem,94vw)] p-0"
          onCloseAutoFocus={preventRadixCloseAutoFocus}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                className="truncate text-sm font-semibold text-foreground hover:underline"
                onClick={toggleAllDraft}
              >
                Status
              </button>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label="Status filter help"
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[14rem] text-xs leading-snug">
                    Click Status to select or deselect all. Use Apply to update filters. All and
                    None set the draft before Apply.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={applyDraft}>
              Apply
            </Button>
          </div>
          <TooltipProvider delayDuration={300}>
            <div className="max-h-[min(16rem,50vh)] overflow-y-auto p-3">
              <ul className="space-y-2">
                {BATCH_STATUS_POPOVER_ORDER.map((status) => renderStatusRow(status))}
              </ul>
            </div>
          </TooltipProvider>
          <div className="flex gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftChecked(allBatchStatusesDraftChecked())}
            >
              All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftChecked(noBatchStatusesDraftChecked())}
            >
              None
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          aria-label="Reset status filter to default"
          onClick={() => onBatchStatusFilterApply([], false)}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ProductionBatchStatusFilter;
