import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, CalendarClock, ChevronRight, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ExpenseOrderDueTimelineBucket,
  ExpenseOrderFinancialBucket,
  ExpenseOrderFinancialSample,
  ExpenseOrderFinancialSnapshot,
  ExpenseOrderUnpaidPipelineBucket,
} from '@/types/orderHub';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

interface ExpenseOrderFinancialOverviewProps {
  snapshot: ExpenseOrderFinancialSnapshot | null | undefined;
  formatCurrency: (v: number | null | undefined) => string;
  formatCompactCurrency: (v: number) => string;
  onCategoryFilter: (categoryKey: string) => void;
  onSelectOrder: (id: number) => void;
  className?: string;
}

function FinancialBarRow({
  label,
  count,
  value,
  maxValue,
  formatCompactCurrency,
  onClick,
  barClassName,
}: {
  label: string;
  count: number;
  value: number;
  maxValue: number;
  formatCompactCurrency: (v: number) => string;
  onClick?: () => void;
  barClassName?: string;
}) {
  const pct = maxValue > 0 ? Math.max(4, (value / maxValue) * 100) : 0;
  const content = (
    <>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium truncate">{label}</span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {count} · {formatCompactCurrency(value)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barClassName ?? 'bg-brand-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full space-y-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
      >
        {content}
      </button>
    );
  }

  return <div className="space-y-1.5">{content}</div>;
}

function SampleLinks({
  samples,
  formatCurrency,
  onSelectOrder,
}: {
  samples: ExpenseOrderFinancialSample[];
  formatCurrency: (v: number | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}) {
  if (samples.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-1">
      {samples.map((sample) => (
        <Button
          key={sample.id}
          variant="ghost"
          size="sm"
          className="w-full max-w-none justify-between h-auto py-1.5 px-2 text-left rounded-lg border border-border/60 bg-background hover:bg-muted/40"
          onClick={() => onSelectOrder(sample.id)}
        >
          <span className="text-sm truncate">
            <span className="font-medium">{sample.order_number}</span>
            {sample.sublabel ? (
              <span className="text-muted-foreground ml-2">{sample.sublabel}</span>
            ) : null}
            {sample.total_value != null ? (
              <span className="text-muted-foreground ml-2">
                {formatCurrency(toNumber(sample.total_value))}
              </span>
            ) : null}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      ))}
    </div>
  );
}

function WidgetEmpty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{message}</p>;
}

function CategoryBreakdownCard({
  buckets,
  formatCompactCurrency,
  onCategoryFilter,
}: {
  buckets: ExpenseOrderFinancialBucket[];
  formatCompactCurrency: (v: number) => string;
  onCategoryFilter: (key: string) => void;
}) {
  const rows = useMemo(
    () =>
      buckets.map((b) => ({
        ...b,
        value: toNumber(b.total_value),
        displayLabel:
          b.key === 'other' ? 'Other' : expenseCategoryLabel(b.key) || b.label,
      })),
    [buckets]
  );
  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Card className="border-border flex flex-col min-h-0">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Category breakdown
        </CardTitle>
        <p className="text-xs text-muted-foreground">In current filter scope</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2">
        {rows.length === 0 ? (
          <WidgetEmpty message="No expenses in this filter scope." />
        ) : (
          rows.map((row) => (
            <FinancialBarRow
              key={row.key}
              label={row.displayLabel}
              count={row.count}
              value={row.value}
              maxValue={maxValue}
              formatCompactCurrency={formatCompactCurrency}
              onClick={
                row.key !== 'other' ? () => onCategoryFilter(row.key) : undefined
              }
              barClassName="bg-violet-500 dark:bg-violet-400"
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DueTimelineCard({
  buckets,
  formatCompactCurrency,
  formatCurrency,
  onSelectOrder,
}: {
  buckets: ExpenseOrderDueTimelineBucket[];
  formatCompactCurrency: (v: number) => string;
  formatCurrency: (v: number | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}) {
  const hasAny = buckets.some((b) => b.count > 0);

  return (
    <Card className="border-border flex flex-col min-h-0">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Due timeline
        </CardTitle>
        <p className="text-xs text-muted-foreground">All open expenses</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-4">
        {!hasAny ? (
          <WidgetEmpty message="No open expenses with due dates in range." />
        ) : (
          buckets.map((bucket) =>
            bucket.count > 0 ? (
              <div key={bucket.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{bucket.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {bucket.count} · {formatCompactCurrency(toNumber(bucket.total_value))}
                  </span>
                </div>
                <SampleLinks
                  samples={bucket.samples}
                  formatCurrency={formatCurrency}
                  onSelectOrder={onSelectOrder}
                />
                {bucket.count > bucket.samples.length ? (
                  <p className="text-xs text-muted-foreground">
                    +{bucket.count - bucket.samples.length} more
                  </p>
                ) : null}
              </div>
            ) : null
          )
        )}
      </CardContent>
    </Card>
  );
}

function UnpaidPipelineCard({
  buckets,
  formatCompactCurrency,
  formatCurrency,
  onSelectOrder,
}: {
  buckets: ExpenseOrderUnpaidPipelineBucket[];
  formatCompactCurrency: (v: number) => string;
  formatCurrency: (v: number | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}) {
  const hasAny = buckets.some((b) => b.count > 0);

  const statusColors: Record<string, string> = {
    unpaid: 'text-amber-600 dark:text-amber-400',
    partial: 'text-sky-600 dark:text-sky-400',
    overdue: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card className="border-border flex flex-col min-h-0">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Unpaid pipeline
        </CardTitle>
        <p className="text-xs text-muted-foreground">All open expenses with invoices</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-4">
        {!hasAny ? (
          <WidgetEmpty message="No unpaid invoice balances on open expenses." />
        ) : (
          buckets.map((bucket) =>
            bucket.count > 0 ? (
              <div key={bucket.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', statusColors[bucket.key])}>
                    {bucket.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {bucket.count} ·{' '}
                    {formatCompactCurrency(toNumber(bucket.outstanding_value))} outstanding
                  </span>
                </div>
                <SampleLinks
                  samples={bucket.samples}
                  formatCurrency={formatCurrency}
                  onSelectOrder={onSelectOrder}
                />
                {bucket.count > bucket.samples.length ? (
                  <p className="text-xs text-muted-foreground">
                    +{bucket.count - bucket.samples.length} more
                  </p>
                ) : null}
              </div>
            ) : null
          )
        )}
      </CardContent>
    </Card>
  );
}

const EMPTY_SNAPSHOT: ExpenseOrderFinancialSnapshot = {
  category_breakdown: [],
  stage_pipeline: [],
  open_by_account: [],
  due_timeline: [],
  unpaid_pipeline: [],
};

const ExpenseOrderFinancialOverview: React.FC<ExpenseOrderFinancialOverviewProps> = ({
  snapshot,
  formatCurrency,
  formatCompactCurrency,
  onCategoryFilter,
  onSelectOrder,
  className,
}) => {
  const data = snapshot ?? EMPTY_SNAPSHOT;

  return (
    <div className={cn('flex flex-col min-h-0 flex-1 space-y-6', className)}>
      <CategoryBreakdownCard
        buckets={data.category_breakdown}
        formatCompactCurrency={formatCompactCurrency}
        onCategoryFilter={onCategoryFilter}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
        <DueTimelineCard
          buckets={data.due_timeline}
          formatCompactCurrency={formatCompactCurrency}
          formatCurrency={formatCurrency}
          onSelectOrder={onSelectOrder}
        />
        <UnpaidPipelineCard
          buckets={data.unpaid_pipeline}
          formatCompactCurrency={formatCompactCurrency}
          formatCurrency={formatCurrency}
          onSelectOrder={onSelectOrder}
        />
      </div>
    </div>
  );
};

export default ExpenseOrderFinancialOverview;
