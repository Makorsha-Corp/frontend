import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import DateRangeFilterTrigger from '@/components/newcomponents/customui/DateRangeFilterTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import type { ProductionLine } from '@/types/production';
import { cn } from '@/lib/utils';
import { ShowCompleteOrdersSwitch } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function parseOptionalBatchFilterDate(isoDay: string): Date | undefined {
  const d = parseISO(isoDay);
  return isValid(d) ? d : undefined;
}

export const PRODUCTION_BATCH_STATUSES = ['draft', 'recurring', 'in_progress', 'completed', 'cancelled'] as const;
export type ProductionBatchStatus = (typeof PRODUCTION_BATCH_STATUSES)[number];

/** URL/localStorage may still store legacy `planned`; map before validating. */
export function normalizeLegacyBatchStatusToken(raw: string): string {
  return raw === 'planned' ? 'recurring' : raw;
}

/** Default: draft + in progress. Completed = list toggle. Cancelled = opt-in here. */
export const DEFAULT_BATCH_STATUS_FILTER: ProductionBatchStatus[] = ['draft', 'in_progress'];

/** Batches week board: include recurring program runs by default. */
export const DEFAULT_WEEK_BATCH_STATUS_FILTER: ProductionBatchStatus[] = [
  'draft',
  'recurring',
  'in_progress',
];

/** Statuses stored in batch status filter (completed uses Show completed / popover row). */
export const BATCH_STATUS_POPOVER_STATUSES: ProductionBatchStatus[] = PRODUCTION_BATCH_STATUSES.filter(
  (s) => s !== 'completed',
);

/** Status popover row order — completed last (synced with list toggle). */
export const BATCH_STATUS_POPOVER_ORDER: ProductionBatchStatus[] = [
  'draft',
  'recurring',
  'in_progress',
  'cancelled',
  'completed',
];

export function stripCompletedFromStatusFilter(
  filter: ProductionBatchStatus[],
): ProductionBatchStatus[] {
  return filter.filter((s) => s !== 'completed');
}

/** Empty selection = default (draft + in_progress). */
export function normalizeBatchStatusFilter(
  filter: ProductionBatchStatus[],
): ProductionBatchStatus[] {
  const stripped = stripCompletedFromStatusFilter(filter);
  if (stripped.length === 0) return [...DEFAULT_BATCH_STATUS_FILTER];
  return stripped;
}

function statusSetEqual(a: ProductionBatchStatus[], b: ProductionBatchStatus[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((status) => setA.has(status));
}

/** Empty stored filter follows the open date view. An explicit list is a custom mix. */
export function isFollowViewBatchStatusDefault(filter: ProductionBatchStatus[]): boolean {
  return stripCompletedFromStatusFilter(filter).length === 0;
}

export function isDayDefaultBatchStatusFilter(filter: ProductionBatchStatus[]): boolean {
  const stripped = stripCompletedFromStatusFilter(filter);
  return (
    statusSetEqual(stripped, DEFAULT_BATCH_STATUS_FILTER) &&
    !stripped.includes('recurring') &&
    !stripped.includes('cancelled')
  );
}

export function isWeekDefaultBatchStatusFilter(filter: ProductionBatchStatus[]): boolean {
  const stripped = stripCompletedFromStatusFilter(filter);
  return statusSetEqual(stripped, DEFAULT_WEEK_BATCH_STATUS_FILTER);
}

/** Week and day include recurring. All dates does not. */
export function viewDefaultBatchStatusFilter(
  dateViewMode?: WorkOrdersDateViewMode,
): ProductionBatchStatus[] {
  if (dateViewMode === 'week' || dateViewMode === 'day') {
    return [...DEFAULT_WEEK_BATCH_STATUS_FILTER];
  }
  return [...DEFAULT_BATCH_STATUS_FILTER];
}

export function resolveEffectiveBatchStatusFilter(
  filter: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): ProductionBatchStatus[] {
  if (isFollowViewBatchStatusDefault(filter)) {
    return viewDefaultBatchStatusFilter(dateViewMode);
  }
  return normalizeBatchStatusFilter(filter);
}

export function batchStatusCheckboxChecked(
  filter: ProductionBatchStatus[],
  status: ProductionBatchStatus,
  dateViewMode?: WorkOrdersDateViewMode,
): boolean {
  return resolveEffectiveBatchStatusFilter(filter, dateViewMode).includes(status);
}

/** Hover hint for status rows in the runs filter popover. */
export function batchStatusFilterRowHint(
  status: ProductionBatchStatus,
  dateViewMode?: WorkOrdersDateViewMode,
): string | undefined {
  if (status !== 'recurring') return undefined;
  if (dateViewMode === 'week') {
    return 'Default on in week view (includes recurring program runs). Reset status filters to restore defaults for this view.';
  }
  if (dateViewMode === 'day') {
    return 'Default on in day view. Reset status filters to restore defaults for this view.';
  }
  if (dateViewMode === 'all') {
    return 'Default off on All dates. Recurring is on by default in week and day views.';
  }
  return 'Default on in week and day views; off on All dates when status filters are reset.';
}

export function isDefaultBatchStatusFilter(
  filter: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): boolean {
  if (isFollowViewBatchStatusDefault(filter)) return true;
  return statusSetEqual(
    stripCompletedFromStatusFilter(filter),
    viewDefaultBatchStatusFilter(dateViewMode),
  );
}

export function formatBatchStatusFilterLabel(
  batchStatusFilter: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): string {
  if (isDefaultBatchStatusFilter(batchStatusFilter, dateViewMode)) return 'All statuses';
  return `${resolveEffectiveBatchStatusFilter(batchStatusFilter, dateViewMode).length} statuses`;
}

/** List panel: completed = Show completed toggle; other statuses = header status filter. */
export function filterBatchesByStatusForList<T extends { status: string }>(
  batches: T[],
  showCompletedBatches: boolean,
  effectiveStatusFilter: ProductionBatchStatus[],
): T[] {
  return batches.filter((b) => {
    const status = b.status as ProductionBatchStatus;
    if (status === 'completed') return showCompletedBatches;
    return effectiveStatusFilter.includes(status);
  });
}

/** Calendar day for list date filter (`batch_date`, else start of `planned_start_at`). */
export function batchListCalendarDay(batch: {
  batch_date?: string | null;
  planned_start_at?: string | null;
}): string | null {
  if (batch.batch_date?.trim()) return batch.batch_date.trim().slice(0, 10);
  if (batch.planned_start_at?.trim()) return batch.planned_start_at.trim().slice(0, 10);
  return null;
}

export function batchMatchesDateRange(
  batch: { batch_date?: string | null; planned_start_at?: string | null },
  from: string | null,
  to: string | null,
): boolean {
  if (!from && !to) return true;
  const day = batchListCalendarDay(batch);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function ShowCompletedBatchesSwitchControl({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const tooltip = checked
    ? 'Completed batches are shown in the list. Toggle off to hide them.'
    : 'Completed batches are hidden. Toggle on to show them in the list.';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <ShowCompleteOrdersSwitch
              checked={checked}
              onCheckedChange={onCheckedChange}
              ariaLabel="Show completed batches"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[14rem] text-xs leading-snug">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface ProductionBatchFiltersBarProps {
  lines: ProductionLine[];
  lineId: number | null;
  onLineChange: (value: string) => void;
  batchStatusFilter: ProductionBatchStatus[];
  batchStatusFilterLabel: string;
  onToggleBatchStatus: (status: ProductionBatchStatus) => void;
  /** Reset to default: all statuses (not an active filter). */
  onClearBatchStatusFilter: () => void;
  showCompletedBatches: boolean;
  onShowCompletedBatchesChange: (value: boolean) => void;
  batchDateFrom: string | null;
  batchDateTo: string | null;
  onBatchDateFromChange: (value: string) => void;
  onBatchDateToChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showSearch?: boolean;
  className?: string;
}

export const ProductionBatchFiltersBar: React.FC<ProductionBatchFiltersBarProps> = ({
  lines,
  lineId,
  onLineChange,
  batchStatusFilter,
  batchStatusFilterLabel,
  onToggleBatchStatus,
  onClearBatchStatusFilter,
  showCompletedBatches,
  onShowCompletedBatchesChange,
  batchDateFrom,
  batchDateTo,
  onBatchDateFromChange,
  onBatchDateToChange,
  searchQuery,
  onSearchQueryChange,
  showSearch = true,
  className,
}) => (
  <div className={cn('flex min-w-0 flex-wrap items-center gap-2 lg:gap-3', className)}>
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <Select value={lineId?.toString() ?? 'all'} onValueChange={onLineChange}>
      <SelectTrigger
        className={cn(
          appShellHeaderControlClass,
          'h-9 w-auto min-w-[8.5rem] max-w-[200px] border-border bg-background [&>span]:min-w-0 [&>span]:truncate',
        )}
      >
        <SelectValue placeholder="Production line" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All lines</SelectItem>
        {lines.map((l) => (
          <SelectItem key={l.id} value={l.id.toString()}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    </div>
    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
      <DateRangeFilterTrigger
        value={{
          from: batchDateFrom ? parseOptionalBatchFilterDate(batchDateFrom) : undefined,
          to: batchDateTo ? parseOptionalBatchFilterDate(batchDateTo) : undefined,
        }}
        onChange={({ from, to }) => {
          onBatchDateFromChange(from ? format(from, 'yyyy-MM-dd') : '');
          onBatchDateToChange(to ? format(to, 'yyyy-MM-dd') : '');
        }}
        triggerClassName="min-w-[11rem] sm:min-w-[200px]"
      />
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            appShellHeaderControlClass,
            'w-auto min-w-0 max-w-[170px] flex-1 shrink basis-0 justify-start overflow-hidden border-border bg-background',
          )}
        >
          <span className="truncate">
            <span className="text-muted-foreground">Status · </span>
            {batchStatusFilterLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <button
            type="button"
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={onClearBatchStatusFilter}
          >
            Show all statuses
          </button>
        </div>
        <Separator className="my-2" />
        <div className="space-y-0.5">
          {BATCH_STATUS_POPOVER_ORDER.map((s) => {
            const isCompleted = s === 'completed';
            const isCancelled = s === 'cancelled';
            const checked = isCompleted
              ? showCompletedBatches
              : batchStatusCheckboxChecked(batchStatusFilter, s);
            return (
              <button
                key={s}
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  if (isCompleted) onShowCompletedBatchesChange(!showCompletedBatches);
                  else onToggleBatchStatus(s);
                }}
              >
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  className={cn(
                    'pointer-events-none',
                    isCompleted &&
                      'data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white',
                    isCancelled &&
                      'data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white',
                  )}
                  aria-hidden
                />
                <span className="capitalize">{s.replace('_', ' ')}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
    {showSearch ? (
      <ProductionBatchSearchBar
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        className="w-full min-w-[140px] sm:w-[200px]"
      />
    ) : null}
  </div>
);

export interface ProductionBatchSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  className?: string;
}

export const ProductionBatchSearchBar: React.FC<ProductionBatchSearchBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  className,
}) => (
  <div className={cn('relative', className)}>
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search batches..."
      value={searchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      className={cn(appShellHeaderControlClass, 'border-border bg-background pl-9')}
    />
  </div>
);

export interface ProductionSetupSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  className?: string;
}

export const ProductionSetupSearchBar: React.FC<ProductionSetupSearchBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  className,
}) => (
  <div className={cn('relative w-full min-w-[140px]', className)}>
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search lines and recipes..."
      value={searchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      className={cn(appShellHeaderControlClass, 'border-border bg-background pl-9')}
    />
  </div>
);
