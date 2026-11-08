import React from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BatchInputStorageRow } from '@/lib/batchInputStorageCheck';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const PRIOR_STEPS_COLUMN_HINT =
  'Output from earlier completed steps in this batch. Counts toward Total available; storage only covers the remainder when you start.';

export interface BatchStartStoragePreviewProps {
  rows: BatchInputStorageRow[];
  loading: boolean;
  loadingItems?: boolean;
  noItems: boolean;
  noInputs: boolean;
  shortages: BatchInputStorageRow[];
  getItemName: (id: number) => string;
  showHighlightLegend?: boolean;
  noInputsMessage?: string;
  onReplenish?: (row: BatchInputStorageRow, action: 'stock' | 'purchase') => void;
}

const BatchStartStoragePreview: React.FC<BatchStartStoragePreviewProps> = ({
  rows,
  loading,
  loadingItems = false,
  noItems,
  noInputs,
  shortages,
  getItemName,
  showHighlightLegend = false,
  noInputsMessage = 'No input items — no storage deduction needed.',
  onReplenish,
}) => {
  if (loadingItems) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (noItems) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
        <p className="font-medium text-destructive">No items added to this batch.</p>
        <p className="text-muted-foreground mt-1">Add at least one item before starting.</p>
      </div>
    );
  }

  if (noInputs) {
    return <p className="text-xs text-muted-foreground">{noInputsMessage}</p>;
  }

  return (
    <div className="grid gap-2">
      {showHighlightLegend ? (
        <p className="text-xs text-muted-foreground">
          Availability includes storage plus output from earlier completed steps. Remaining need
          comes from storage when you start. Rows marked{' '}
          <Badge variant="secondary" className="mx-0.5 align-middle text-[10px] px-1.5 py-0">
            This step
          </Badge>{' '}
          are used on this step.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking storage…
        </p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right w-[4.5rem]">Required</TableHead>
                <TableHead className="text-right w-[4.5rem]">Storage</TableHead>
                <TableHead className="text-right w-[4.5rem]">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block cursor-help">Prior steps</span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="end"
                        className="max-w-[14rem] text-xs leading-snug"
                      >
                        {PRIOR_STEPS_COLUMN_HINT}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right w-[4.5rem]">Total</TableHead>
                <TableHead className="w-[4.5rem]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.batchItemId}
                  className={cn(row.isHighlighted && 'bg-muted/40')}
                >
                  <TableCell className="py-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className={cn('truncate', row.isHighlighted && 'font-medium')}>
                        {getItemName(row.itemId)}
                      </span>
                      {row.isHighlighted ? (
                        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                          This step
                        </Badge>
                      ) : null}
                      {row.isShort && onReplenish ? (
                        <span className="flex w-full flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => onReplenish(row, 'stock')}
                          >
                            Add stock
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => onReplenish(row, 'purchase')}
                          >
                            New purchase
                          </Button>
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums py-2">{row.required}</TableCell>
                  <TableCell className="text-right tabular-nums py-2">{row.onHandStorage}</TableCell>
                  <TableCell className="text-right tabular-nums py-2">
                    {row.fromPriorSteps > 0 ? row.fromPriorSteps : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums py-2">{row.onHand}</TableCell>
                  <TableCell className="py-2">
                    {row.isShort ? (
                      <span className="text-destructive text-xs font-medium">Short</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {!loading && shortages.length > 0 ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive mb-2">Not enough material for input items</p>
          <ul className="list-disc pl-4 space-y-1">
            {shortages.map((s) => (
              <li key={s.batchItemId}>
                {getItemName(s.itemId)}: need {s.required}, total available {s.onHand}
                {s.fromPriorSteps > 0
                  ? ` (storage ${s.onHandStorage}, prior steps ${s.fromPriorSteps})`
                  : ` (storage ${s.onHandStorage})`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default BatchStartStoragePreview;
