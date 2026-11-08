import React, { useEffect, useMemo, useState } from 'react';
import { addMonths, startOfDay } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  appShellHeaderBoxedControlClass,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import {
  formatDateRangeFilterLabel,
  type DateRangeValue,
} from '@/components/newcomponents/customui/DateRangeFilterTrigger';
import { parseOptionalBatchFilterDate } from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

export interface ProductionOverviewDateRangeFilterProps {
  batchDateFrom: string | null;
  batchDateTo: string | null;
  onBatchDateRangeApply: (from: string | null, to: string | null) => void;
  className?: string;
}

function isoFromDate(date: Date | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function committedToDraft(from: string | null, to: string | null): DateRangeValue {
  return {
    from: from ? parseOptionalBatchFilterDate(from) : undefined,
    to: to ? parseOptionalBatchFilterDate(to) : undefined,
  };
}

const ProductionOverviewDateRangeFilter: React.FC<ProductionOverviewDateRangeFilterProps> = ({
  batchDateFrom,
  batchDateTo,
  onBatchDateRangeApply,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(() =>
    committedToDraft(batchDateFrom, batchDateTo),
  );

  useEffect(() => {
    if (!open) return;
    setDraft(committedToDraft(batchDateFrom, batchDateTo));
  }, [open, batchDateFrom, batchDateTo]);

  const displayLabel = useMemo(
    () => formatDateRangeFilterLabel(committedToDraft(batchDateFrom, batchDateTo)),
    [batchDateFrom, batchDateTo],
  );

  const showClear = Boolean(batchDateFrom || batchDateTo);

  const applyDraft = () => {
    let from = draft.from;
    let to = draft.to;
    if (from && to && startOfDay(to) < startOfDay(from)) {
      [from, to] = [to, from];
    }
    onBatchDateRangeApply(isoFromDate(from), isoFromDate(to));
    setOpen(false);
  };

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <MachineSelectSummaryButton
            ariaLabel={`Filter overview by date range. Current: ${displayLabel}`}
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
          className="w-auto max-w-[min(42rem,calc(100vw-1rem))] p-0"
          sideOffset={6}
          onCloseAutoFocus={preventRadixCloseAutoFocus}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">Date range</h3>
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={applyDraft}>
              Apply
            </Button>
          </div>
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-start">
            <div className="min-w-0 shrink-0">
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </p>
              <Calendar
                mode="single"
                selected={draft.from}
                onSelect={(date) =>
                  setDraft((prev) => {
                    const next: DateRangeValue = { ...prev, from: date };
                    if (date && prev.to && startOfDay(prev.to) < startOfDay(date)) {
                      next.to = undefined;
                    }
                    return next;
                  })
                }
                defaultMonth={draft.from ?? draft.to ?? new Date()}
                numberOfMonths={1}
              />
            </div>
            <div className="min-w-0 shrink-0">
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End
              </p>
              <Calendar
                mode="single"
                selected={draft.to}
                onSelect={(date) => setDraft((prev) => ({ ...prev, to: date }))}
                defaultMonth={draft.to ?? draft.from ?? addMonths(new Date(), 1)}
                numberOfMonths={1}
                disabled={
                  draft.from ? { before: startOfDay(draft.from) } : undefined
                }
              />
            </div>
          </div>
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setDraft({})}
            >
              All dates
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
          aria-label="Clear date range filter"
          onClick={() => onBatchDateRangeApply(null, null)}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ProductionOverviewDateRangeFilter;
