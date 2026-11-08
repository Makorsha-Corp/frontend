import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useGetAllFormulaStageItemsQuery } from '@/features/production/productionApi';
import type { ProductionBatch, ProductionFormula } from '@/types/production';
import { batchCardDate } from '@/lib/millCalendarDate';
import { productionBatchRowSelectedClass } from '../productionPageUtils';

interface BatchRowProps {
  batch: ProductionBatch;
  formulas: ProductionFormula[];
  getItemName: (itemId: number) => string;
  getStatusBadge: (s: string) => string;
  isSelected?: boolean;
  onClick?: () => void;
  factoryNameHint?: string | null;
  plannedShiftLabel?: string | null;
}

function formatPlannedStart(batch: ProductionBatch): string {
  if (batch.planned_start_at) {
    const date = new Date(batch.planned_start_at);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  }
  if (!batch.batch_date) return '—';
  const date = batchCardDate(batch.batch_date);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

const BatchRow: React.FC<BatchRowProps> = ({
  batch,
  formulas,
  getItemName,
  getStatusBadge,
  isSelected,
  onClick,
  factoryNameHint,
  plannedShiftLabel,
}) => {
  const formula = batch.formula_id ? formulas.find((f) => f.id === batch.formula_id) : null;
  const { data: stageItems = [] } = useGetAllFormulaStageItemsQuery(batch.formula_id ?? 0, {
    skip: !batch.formula_id,
  });

  const outputName = useMemo(() => {
    const outputIds = new Set<number>();
    for (const row of stageItems) {
      if (row.item_role === 'output') outputIds.add(row.item_id);
    }
    const names = Array.from(outputIds).map(getItemName).filter(Boolean);
    if (names.length > 0) return names.join(', ');
    return null;
  }, [stageItems, getItemName]);

  const recipeLabel = formula ? formula.name : 'Simple';
  const expectedQty =
    batch.expected_output_quantity != null ? String(batch.expected_output_quantity) : '—';

  const plannedWhenLine = useMemo(() => {
    const when = formatPlannedStart(batch);
    if (plannedShiftLabel) return `${when} · ${plannedShiftLabel}`;
    return when;
  }, [batch, plannedShiftLabel]);

  return (
    <div
      className={cn(
        'cursor-pointer px-4 py-3 hover:bg-muted/50',
        isSelected && productionBatchRowSelectedClass,
      )}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-card-foreground">{batch.batch_number}</span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-semibold capitalize',
                getStatusBadge(batch.status),
              )}
            >
              {batch.status.replace('_', ' ')}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {recipeLabel}
            {factoryNameHint ? (
              <span className="text-muted-foreground/80"> · {factoryNameHint}</span>
            ) : null}
          </p>
          {outputName ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="w-fit max-w-full cursor-default truncate text-xs text-muted-foreground tabular-nums">
                    {plannedWhenLine}
                    {' · '}
                    Expected {expectedQty}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-sm text-sm">
                  {outputName}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <p className="text-xs text-muted-foreground tabular-nums">
              {plannedWhenLine}
              {' · '}
              Expected {expectedQty}
            </p>
          )}
          {outputName ? (
            <p className="truncate text-xs text-foreground/80">{outputName}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BatchRow;
