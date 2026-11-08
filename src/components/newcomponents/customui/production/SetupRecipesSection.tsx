import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ProductionFormula } from '@/types/production';
import { ChevronDown, Loader2, Plus } from 'lucide-react';

export interface SetupRecipesSectionProps {
  selectedRouteId: number | null;
  formulasOnRoute: ProductionFormula[];
  formulasWithoutRoute: ProductionFormula[];
  loadingFormulas: boolean;
  formulasError: unknown;
  onAddRecipe: () => void;
  onSelectFormula: (formulaId: number) => void;
  className?: string;
}

const SetupRecipesSection: React.FC<SetupRecipesSectionProps> = ({
  selectedRouteId,
  formulasOnRoute,
  formulasWithoutRoute,
  loadingFormulas,
  formulasError,
  onAddRecipe,
  onSelectFormula,
  className,
}) => {
  const [unattachedOpen, setUnattachedOpen] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recipes</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!selectedRouteId}
          title={!selectedRouteId ? 'Select a route first' : undefined}
          onClick={onAddRecipe}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add recipe
        </Button>
      </div>
      {formulasError ? (
        <p className="text-center text-sm text-destructive">Failed to load recipes</p>
      ) : loadingFormulas ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : !selectedRouteId ? (
        <p className="text-sm text-muted-foreground">Select a route to add or view recipes.</p>
      ) : (
        <div className="space-y-4">
          {formulasOnRoute.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipes on this route yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {formulasOnRoute.map((formula) => (
                <button
                  key={formula.id}
                  type="button"
                  onClick={() => onSelectFormula(formula.id)}
                  className="rounded-md border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="block truncate text-sm font-medium">{formula.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{formula.formula_code}</span>
                </button>
              ))}
            </div>
          )}
          {formulasWithoutRoute.length > 0 && (
            <Collapsible open={unattachedOpen} onOpenChange={setUnattachedOpen} className="border-t border-border pt-3">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-between px-0 hover:bg-transparent">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Not on a route ({formulasWithoutRoute.length})
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted-foreground transition-transform', unattachedOpen && 'rotate-180')}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Open a recipe and attach a process route in the recipe details dialog.
                </p>
                <div className="flex flex-col gap-2">
                  {formulasWithoutRoute.map((formula) => (
                    <button
                      key={formula.id}
                      type="button"
                      onClick={() => onSelectFormula(formula.id)}
                      className="rounded-md border border-dashed border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="block truncate text-sm font-medium">{formula.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{formula.formula_code}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupRecipesSection;
