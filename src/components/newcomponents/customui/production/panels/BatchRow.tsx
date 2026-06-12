import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useGetFormulaItemsQuery,
  useGetBatchItemsQuery,
} from '@/features/production/productionApi';
import type { ProductionBatch, ProductionLine, ProductionFormula } from '@/types/production';
import { Check, X } from 'lucide-react';
import { productionBatchRowSelectedClass } from '../productionPageUtils';
interface BatchRowProps {
  batch: ProductionBatch;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  getItemName: (itemId: number) => string;
  getStatusBadge: (s: string) => string;
  isSelected?: boolean;
  onClick?: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const BatchRow: React.FC<BatchRowProps> = ({
  batch,
  lines,
  formulas,
  getItemName,
  getStatusBadge,
  isSelected,
  onClick,
  onComplete,
  onCancel,
}) => {
  const line = lines.find((l) => l.id === batch.production_line_id);
  const formula = batch.formula_id
    ? formulas.find((f) => f.id === batch.formula_id)
    : null;
  const { data: formulaItems = [] } = useGetFormulaItemsQuery(
    { formulaId: batch.formula_id ?? 0 },
    { skip: !batch.formula_id }
  );
  const { data: batchRowItems = [] } = useGetBatchItemsQuery(
    { batchId: batch.id },
    { skip: !batch.id }
  );
  const returnProductNames = useMemo(() => {
    const outputIds = new Set<number>();
    for (const row of formulaItems) {
      if (row.item_role === 'output') outputIds.add(row.item_id);
    }
    for (const row of batchRowItems) {
      if (row.item_role === 'output') outputIds.add(row.item_id);
    }
    return Array.from(outputIds).map(getItemName).filter(Boolean);
  }, [formulaItems, batchRowItems, getItemName]);
  const returnProductsDisplay =
    returnProductNames.length > 0 ? returnProductNames.join(', ') : 'No products yet';

  return (
    <div
      className={cn('flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer', isSelected && productionBatchRowSelectedClass)}
      onClick={onClick}
    >
        <div>
        <div className="font-medium text-card-foreground">{batch.batch_number}</div>
        <div className="text-sm text-muted-foreground">
          {line?.name ?? `Line #${batch.production_line_id}`}
          {formula && ` â€¢ ${formula.name}`}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(batch.status)}`}>
            {batch.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(batch.batch_date).toLocaleDateString()}
            {batch.expected_output_quantity != null && ` â€¢ Expected: ${batch.expected_output_quantity}`}
            {batch.actual_output_quantity != null && ` â€¢ Actual: ${batch.actual_output_quantity}`}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs text-muted-foreground">{returnProductsDisplay}</div>
        <div className="flex items-center gap-1">
        {batch.status === 'in_progress' && (
          <>
            <Button size="sm" variant="outline" onClick={onComplete}>
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default BatchRow;

