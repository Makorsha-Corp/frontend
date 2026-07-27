import { AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WorkOrderStockShortfall } from '@/pages/newpages/orders/workOrderStockShortfall';

export interface WorkOrderStockShortfallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortfalls: WorkOrderStockShortfall[];
  isRecurring: boolean;
  occurrenceCount: number;
  recurrenceStartIso?: string | null;
  recurrenceEndIso?: string | null;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function WorkOrderStockShortfallDialog({
  open,
  onOpenChange,
  shortfalls,
  isRecurring,
  occurrenceCount,
  recurrenceStartIso,
  recurrenceEndIso,
  onConfirm,
  isConfirming = false,
}: WorkOrderStockShortfallDialogProps) {
  if (shortfalls.length === 0) return null;

  const recurrenceRangeLabel =
    isRecurring && recurrenceStartIso && recurrenceEndIso
      ? `${format(parseISO(recurrenceStartIso), 'MMM d, yyyy')} – ${format(parseISO(recurrenceEndIso), 'MMM d, yyyy')}`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
            Stock may not last
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm text-muted-foreground">
              <p>
                {isRecurring
                  ? 'If every planned order uses these parts, storage or machine stock may run out before the schedule finishes.'
                  : 'This order may use more than you have on hand.'}
              </p>
              {isRecurring && occurrenceCount > 1 ? (
                <p>
                  Based on{' '}
                  <span className="font-medium text-foreground">{occurrenceCount} planned dates</span>
                  {recurrenceRangeLabel ? (
                    <>
                      {' '}
                      ({recurrenceRangeLabel})
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
              <div className="max-h-52 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 font-medium text-foreground">Item</th>
                      <th className="px-3 py-2 font-medium text-foreground">Source</th>
                      <th className="px-3 py-2 font-medium text-foreground text-right">Required</th>
                      <th className="px-3 py-2 font-medium text-foreground text-right">On hand</th>
                      <th className="px-3 py-2 font-medium text-foreground text-right">Short</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortfalls.map((row) => (
                      <tr key={`${row.itemId}-${row.sourceLabel}`} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2 text-foreground">{row.itemName}</td>
                        <td className="px-3 py-2">{row.sourceLabel}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.requiredQty}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.onHandQty}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-amber-700 dark:text-amber-400">
                          {row.shortBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px]">Quantities from last loaded stock snapshot.</p>
              <p>Replenish stock or continue anyway?</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Go back
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
