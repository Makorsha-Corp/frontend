import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  appendUnitInParens,
  buildStageMaterialDisplayRows,
} from '@/lib/productionStageMaterialsDisplay';
import {
  formatProductionQuantity,
  formatProductionScaleFactor,
  parseProductionQuantity,
  roundProductionQuantity,
} from '@/lib/productionQuantity';
import type {
  ProductionFormulaStage,
  ProductionFormulaStageItem,
  ProductionFormulaStageParameter,
} from '@/types/production';

interface AddBatchRecipeStepMaterialsProps {
  stage: ProductionFormulaStage | null;
  stageItems: ProductionFormulaStageItem[];
  stageParameters: ProductionFormulaStageParameter[];
  items: { id: number; name: string; unit?: string }[];
  itemQtyDrafts: Record<number, string>;
  onQtyChange: (stageItemId: number, value: string) => void;
  conditionPlannedDrafts: Record<number, string>;
  onConditionPlannedChange: (parameterId: number, value: string) => void;
  /** Target ÷ recipe finished-good output. Omit or 1 = no scale hint. */
  materialScaleMultiplier?: number;
  /** Finished-good output the recipe is written for (same base as multiplier). */
  materialScaleBaseOutput?: number;
  materialScaleTargetOutput?: number;
  /** Inside step editor card — no duplicate title / outer padding */
  embedded?: boolean;
}

const AddBatchRecipeStepMaterials: React.FC<AddBatchRecipeStepMaterialsProps> = ({
  stage,
  stageItems,
  stageParameters,
  items,
  itemQtyDrafts,
  onQtyChange,
  conditionPlannedDrafts,
  onConditionPlannedChange,
  materialScaleMultiplier = 1,
  materialScaleBaseOutput,
  materialScaleTargetOutput,
  embedded = false,
}) => {
  const showMaterialScale =
    materialScaleMultiplier > 0 &&
    Math.abs(materialScaleMultiplier - 1) > 0.000_1 &&
    materialScaleBaseOutput != null &&
    materialScaleBaseOutput > 0 &&
    materialScaleTargetOutput != null &&
    materialScaleTargetOutput > 0;
  const resolveItemUnit = (row: ProductionFormulaStageItem): string | null => {
    const fromStage = row.unit?.trim();
    if (fromStage) return fromStage;
    const fromCatalog = items.find((item) => item.id === row.item_id)?.unit?.trim();
    return fromCatalog || null;
  };

  const displayRows = useMemo(() => {
    if (!stage) return [];
    return buildStageMaterialDisplayRows(stageItems, stageParameters, stage.id);
  }, [stage, stageItems, stageParameters]);

  if (!stage) {
    if (embedded) return null;
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
        Select a step to view materials.
      </p>
    );
  }

  if (displayRows.length === 0) {
    return (
      <p
        className={
          embedded
            ? 'text-sm text-muted-foreground'
            : 'rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground'
        }
      >
        No materials on this step.
      </p>
    );
  }

  const list = (
      <ul className="space-y-2">
        {displayRows.map((entry) => {
          if (entry.kind === 'condition') {
            const row = entry.row;
            return (
              <li key={`cond-${row.id}`} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {appendUnitInParens(row.label, row.unit)}{' '}
                  <span className="text-muted-foreground">(condition)</span>
                </span>
                <Input
                  className="h-8 w-[3.5rem] shrink-0 px-1.5 tabular-nums"
                  value={conditionPlannedDrafts[row.id] ?? row.planned_value}
                  onChange={(e) => onConditionPlannedChange(row.id, e.target.value)}
                  aria-label={`Planned ${row.label}`}
                />
              </li>
            );
          }

          const row = entry.row;
          const unitLabel = resolveItemUnit(row);
          const recipeQty = roundProductionQuantity(Number(row.quantity) || 0);
          const scaledQty = roundProductionQuantity(recipeQty * materialScaleMultiplier);
          const draftRaw = itemQtyDrafts[row.id] ?? String(scaledQty);
          const draftParsed = parseProductionQuantity(draftRaw);
          const editedFromScale =
            showMaterialScale &&
            draftParsed != null &&
            Math.abs(draftParsed - scaledQty) > 0.001;
          return (
            <li key={row.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  {appendUnitInParens(
                    items.find((item) => item.id === row.item_id)?.name ?? `Item #${row.item_id}`,
                    unitLabel,
                  )}{' '}
                  <span className="text-muted-foreground">({row.item_role})</span>
                </div>
                {showMaterialScale ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatProductionQuantity(recipeQty)} ×{' '}
                    {formatProductionScaleFactor(materialScaleMultiplier)} ={' '}
                    {formatProductionQuantity(scaledQty)}
                    {unitLabel ? ` ${unitLabel}` : ''}
                    {editedFromScale ? ' · edited' : ''}
                  </p>
                ) : null}
              </div>
              <Input
                className="h-8 w-[4.5rem] shrink-0 self-end px-1.5 tabular-nums sm:self-auto"
                inputMode="numeric"
                value={draftRaw}
                onChange={(e) => onQtyChange(row.id, e.target.value)}
                aria-label={`Quantity for ${row.item_role}`}
              />
            </li>
          );
        })}
      </ul>
  );

  if (embedded) return list;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{stage.name}</p>
      {list}
    </div>
  );
};

export default AddBatchRecipeStepMaterials;
