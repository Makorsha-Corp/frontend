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
  ACTIVITY_RECIPE_FILTER_NONE,
  isActivityRecipeChecked,
  isDefaultActivityRecipeFilter,
  productionActivityRecipeFilterLabel,
  toggleActivityRecipeId,
  toggleAllActivityRecipes,
} from '@/lib/productionActivityRecipeFilter';
import type { ProductionFormula } from '@/types/production';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

export interface ProductionActivityRecipeFilterProps {
  formulas: ProductionFormula[];
  selectedFormulaIds: number[];
  onSelectedFormulaIdsChange: (ids: number[]) => void;
  className?: string;
}

const ProductionActivityRecipeFilter: React.FC<ProductionActivityRecipeFilterProps> = ({
  formulas,
  selectedFormulaIds,
  onSelectedFormulaIdsChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [draftFormulaIds, setDraftFormulaIds] = useState<number[]>(selectedFormulaIds);

  const activeFormulas = useMemo(() => formulas.filter((f) => f.is_active), [formulas]);
  const activeFormulaIds = useMemo(() => activeFormulas.map((f) => f.id), [activeFormulas]);

  useEffect(() => {
    if (!open) return;
    setDraftFormulaIds(selectedFormulaIds);
  }, [open, selectedFormulaIds]);

  const displayLabel = useMemo(
    () => productionActivityRecipeFilterLabel(activeFormulas, selectedFormulaIds),
    [activeFormulas, selectedFormulaIds],
  );

  const showClear = !isDefaultActivityRecipeFilter(selectedFormulaIds);

  const applyDraft = () => {
    onSelectedFormulaIdsChange(draftFormulaIds);
    setOpen(false);
  };

  const toggleDraftFormula = (id: number) => {
    setDraftFormulaIds((prev) => toggleActivityRecipeId(prev, id, activeFormulaIds));
  };

  const toggleAllDraft = () => {
    setDraftFormulaIds((prev) => toggleAllActivityRecipes(prev, activeFormulaIds));
  };

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <MachineSelectSummaryButton
            ariaLabel={
              isDefaultActivityRecipeFilter(selectedFormulaIds)
                ? 'Filter activity by recipe. Currently showing all recipes.'
                : `Filter activity by recipe. Current: ${displayLabel}`
            }
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
                Activity recipes
              </button>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label="Activity recipes help"
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[14rem] text-xs leading-snug">
                    Click Activity recipes to select or deselect all. Use Apply to update the
                    chart. All and None set the draft before Apply.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={applyDraft}>
              Apply
            </Button>
          </div>
          <div className="max-h-[min(16rem,50vh)] overflow-y-auto p-3">
            {activeFormulas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active recipes.</p>
            ) : (
              <ul className="space-y-2">
                {activeFormulas.map((formula) => (
                  <li key={formula.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`activity-recipe-${formula.id}`}
                      checked={isActivityRecipeChecked(draftFormulaIds, formula.id)}
                      onCheckedChange={() => toggleDraftFormula(formula.id)}
                    />
                    <Label
                      htmlFor={`activity-recipe-${formula.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {formula.name}
                    </Label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftFormulaIds([])}
            >
              All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftFormulaIds([ACTIVITY_RECIPE_FILTER_NONE])}
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
          aria-label="Reset recipe filter to all recipes"
          onClick={() => onSelectedFormulaIdsChange([])}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ProductionActivityRecipeFilter;
