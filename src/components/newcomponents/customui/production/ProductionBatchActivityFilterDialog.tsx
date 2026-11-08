import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ProductionFormula, ProductionLine } from '@/types/production';

export interface ProductionBatchActivityFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  lineIds: number[];
  formulaIds: number[];
  onApply: (lineIds: number[], formulaIds: number[]) => void;
}

const ProductionBatchActivityFilterDialog: React.FC<ProductionBatchActivityFilterDialogProps> = ({
  open,
  onOpenChange,
  lines,
  formulas,
  lineIds,
  formulaIds,
  onApply,
}) => {
  const [draftLineIds, setDraftLineIds] = useState<number[]>(lineIds);
  const [draftFormulaIds, setDraftFormulaIds] = useState<number[]>(formulaIds);

  useEffect(() => {
    if (!open) return;
    setDraftLineIds(lineIds);
    setDraftFormulaIds(formulaIds);
  }, [open, lineIds, formulaIds]);

  const activeFormulas = useMemo(() => formulas.filter((f) => f.is_active), [formulas]);

  const toggleLine = (id: number) => {
    setDraftLineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleFormula = (id: number) => {
    setDraftFormulaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[66vh] w-[min(32rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Activity chart filters</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Leave all unchecked to include every line and recipe (or the line picked in the page
            header when set). Status still follows the header filter.
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Production lines
            </p>
            <ul className="space-y-2">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`activity-line-${line.id}`}
                    checked={draftLineIds.includes(line.id)}
                    onCheckedChange={() => toggleLine(line.id)}
                  />
                  <Label htmlFor={`activity-line-${line.id}`} className="cursor-pointer font-normal">
                    {line.name}
                  </Label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recipes
            </p>
            {activeFormulas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active recipes.</p>
            ) : (
              <ul className="space-y-2">
                {activeFormulas.map((formula) => (
                  <li key={formula.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`activity-formula-${formula.id}`}
                      checked={draftFormulaIds.includes(formula.id)}
                      onCheckedChange={() => toggleFormula(formula.id)}
                    />
                    <Label
                      htmlFor={`activity-formula-${formula.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {formula.name}
                    </Label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraftLineIds([]);
              setDraftFormulaIds([]);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={() => {
              onApply(draftLineIds, draftFormulaIds);
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionBatchActivityFilterDialog;
