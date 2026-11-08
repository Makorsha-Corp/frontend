import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatMachineStatusSummary } from '@/components/newcomponents/customui/production/StationMachinesField';
import SetupRecipeWorkspace from '@/components/newcomponents/customui/production/SetupRecipeWorkspace';
import { productionLineHasMachines } from '@/lib/productionLineMachines';
import { cn } from '@/lib/utils';
import type { ProductionFormula, ProductionLine } from '@/types/production';
import { ChevronDown, Info, Loader2, Plus } from 'lucide-react';

export interface ProductionSetupPanelProps {
  factoryId: number | null;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  loadingLines: boolean;
  linesError: unknown;
  loadingFormulas: boolean;
  formulasError: unknown;
  items: { id: number; name: string; unit?: string }[];
  getItemName: (id: number) => string;
  onAddStation: () => void;
  onSelectStation: (line: ProductionLine) => void;
  onAddRecipe: () => void;
  /** Opens AddEditFormulaDialog for recipe metadata (code, name, description, duration). */
  onEditRecipe: (formulaId: number) => void;
  onDeleteRecipe?: (formulaId: number) => void;
  isDeletingRecipe?: boolean;
  focusFormulaId?: number | null;
  onFocusFormulaHandled?: () => void;
  showFactoryScopeAll?: boolean;
  factoryNameById?: Map<number, string>;
}

const SetupHeaderInfo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="h-3.5 w-3.5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" align="start" className="max-w-xs text-sm">
      {children}
    </TooltipContent>
  </Tooltip>
);

const ProductionSetupPanel: React.FC<ProductionSetupPanelProps> = ({
  factoryId,
  lines,
  formulas,
  loadingLines,
  linesError,
  loadingFormulas,
  formulasError,
  items,
  getItemName,
  onAddStation,
  onSelectStation,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,
  isDeletingRecipe = false,
  focusFormulaId = null,
  onFocusFormulaHandled,
  showFactoryScopeAll = false,
  factoryNameById,
}) => {
  const { t } = useTranslation('production');
  const [linesExpanded, setLinesExpanded] = useState(false);
  const linesCountLabel = useMemo(() => {
    if (loadingLines) return null;
    const count = lines.length;
    return count === 1 ? t('linesCount_one', { count }) : t('linesCount_other', { count });
  }, [lines.length, loadingLines, t]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <Card className="shrink-0 border-border">
          <CardContent className="p-0">
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-3 px-4 py-2',
                linesExpanded && 'border-b border-border',
              )}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left transition-colors hover:bg-muted/30 -mx-1 px-1 py-0.5"
                onClick={() => setLinesExpanded((open) => !open)}
                aria-expanded={linesExpanded}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    linesExpanded && 'rotate-180',
                  )}
                />
                <div className="flex min-w-0 flex-1 items-center gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{t('productionLines')}</span>
                  <SetupHeaderInfo label={t('aboutLines')}>
                    {t('aboutLinesBody')}
                  </SetupHeaderInfo>
                  {linesCountLabel ? (
                    <span className="ml-1 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {linesCountLabel}
                    </span>
                  ) : null}
                </div>
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAddStation}
                title={t('addProductionLine')}
                className="shrink-0"
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('addProductionLine')}
              </Button>
            </div>
            {linesExpanded ? (
              <div className="max-h-[min(240px,32vh)] overflow-y-auto p-3">
                {linesError ? (
                  <p className="text-center text-sm text-destructive">{t('failedLines')}</p>
                ) : loadingLines ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                  </div>
                ) : lines.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t('noProductionLines')}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lines.map((line) => {
                      const statusLine = formatMachineStatusSummary(line.machine_status_summary);
                      const hasMachines = productionLineHasMachines(line);
                      const machineLabel =
                        line.machines && line.machines.length > 0
                          ? line.machines.length <= 2
                            ? line.machines.map((m) => m.name).join(', ')
                            : t('machinesCount', { count: line.machines.length })
                          : null;
                      const card = (
                        <button
                          type="button"
                          onClick={() => onSelectStation(line)}
                          className={cn(
                            'rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40',
                            hasMachines
                              ? 'border-border bg-background'
                              : 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15',
                          )}
                        >
                          <span className="block truncate">{line.name}</span>
                          {showFactoryScopeAll && factoryNameById ? (
                            <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">
                              {factoryNameById.get(line.factory_id) ?? t('factoryFallback')}
                            </span>
                          ) : null}
                          {machineLabel ? (
                            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                              {machineLabel}
                              {statusLine ? ` · ${statusLine}` : ''}
                            </span>
                          ) : (
                            <span className="mt-0.5 block truncate text-xs font-normal text-amber-800 dark:text-amber-200">
                              {t('noMachinesAssigned')}
                            </span>
                          )}
                        </button>
                      );
                      if (hasMachines) return card;
                      return (
                        <Tooltip key={line.id}>
                          <TooltipTrigger asChild>{card}</TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-sm">
                            {t('noMachinesTooltip')}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border">
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <SetupRecipeWorkspace
              factoryId={factoryId}
              formulas={formulas}
              loadingFormulas={loadingFormulas}
              formulasError={formulasError}
              lines={lines}
              items={items}
              getItemName={getItemName}
              onAddRecipe={onAddRecipe}
              onEditRecipe={onEditRecipe}
              onDeleteRecipe={onDeleteRecipe}
              isDeletingRecipe={isDeletingRecipe}
              focusFormulaId={focusFormulaId}
              onFocusFormulaHandled={onFocusFormulaHandled}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ProductionSetupPanel;
