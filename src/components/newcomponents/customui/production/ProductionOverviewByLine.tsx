import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type {
  ProductionLineStatsRow,
  ProductionOverviewStats,
  ProductionRecipeStatsRow,
} from '@/types/production';
import {
  PRODUCTION_OVERVIEW_KPI_COLUMNS,
  type ProductionOverviewKpiColumnId,
  readOverviewKpiColumnIds,
  toggleOverviewKpiColumn,
  writeOverviewKpiColumnIds,
} from '@/lib/productionOverviewKpiColumns';
import { ChevronDown, ChevronRight, Columns3, Loader2 } from 'lucide-react';

function fmtPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

function fmtMinutes(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)} ${unit}`;
}

function fmtQty(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

const metricHeaderClass =
  'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';

type StatsRow = ProductionLineStatsRow | ProductionRecipeStatsRow;

function formatKpiCell(
  id: ProductionOverviewKpiColumnId,
  row: StatsRow,
  minuteUnit: string,
): React.ReactNode {
  switch (id) {
    case 'batch_count':
      return row.batch_count ?? 0;
    case 'output_quantity':
      return fmtQty(row.output_quantity);
    case 'waste_quantity':
      return fmtQty(row.waste_quantity);
    case 'yield_pct':
      return fmtPct(row.yield_pct);
    case 'time_vs_plan_pct':
      return fmtPct(row.time_vs_plan_pct);
    case 'avg_start_lag_minutes':
      return fmtMinutes(row.avg_start_lag_minutes, minuteUnit);
    case 'avg_step_gap_minutes':
      return fmtMinutes(row.avg_step_gap_minutes, minuteUnit);
    default:
      return '—';
  }
}

function renderStartLagCell(
  row: StatsRow,
  minuteUnit: string,
  lateLabel: (count: number) => string,
): React.ReactNode {
  const base = fmtMinutes(row.avg_start_lag_minutes, minuteUnit);
  const late = 'late_start_count' in row ? row.late_start_count : 0;
  if (late > 0) {
    return (
      <>
        {base}
        <span className="ml-1 text-xs text-amber-700 dark:text-amber-400">{lateLabel(late)}</span>
      </>
    );
  }
  return base;
}

export interface ProductionOverviewByLineProps {
  stats: ProductionOverviewStats | undefined;
  loading?: boolean;
  className?: string;
}

const ProductionOverviewByLine: React.FC<ProductionOverviewByLineProps> = ({
  stats,
  loading,
  className,
}) => {
  const { t } = useTranslation('production');
  const minuteUnit = t('minutesShort');
  const kpiLabel = (id: ProductionOverviewKpiColumnId) => t(`kpi_${id}`);
  const [expandedLineIds, setExpandedLineIds] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<ProductionOverviewKpiColumnId[]>(() =>
    readOverviewKpiColumnIds(),
  );
  const [columnsOpen, setColumnsOpen] = useState(false);

  useEffect(() => {
    writeOverviewKpiColumnIds(visibleColumns);
  }, [visibleColumns]);

  const columnMeta = useMemo(
    () =>
      visibleColumns
        .map((id) => PRODUCTION_OVERVIEW_KPI_COLUMNS.find((c) => c.id === id))
        .filter(Boolean) as typeof PRODUCTION_OVERVIEW_KPI_COLUMNS,
    [visibleColumns],
  );

  const toggleLine = (lineId: number) => {
    setExpandedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const subtitleMetrics = columnMeta.map((c) => kpiLabel(c.id)).join(', ');

  return (
    <div className={cn('grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]', className)}>
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t('byLine')}</CardTitle>
              {stats ? (
                <p className="text-xs text-muted-foreground">
                  {stats.date_from} → {stats.date_to}
                  {subtitleMetrics ? ` · ${subtitleMetrics}` : null}
                </p>
              ) : null}
            </div>
            <Popover open={columnsOpen} onOpenChange={setColumnsOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <Columns3 className="h-4 w-4" />
                  {t('columns')}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('visibleMetrics')}
                </p>
                <ul className="space-y-2">
                  {PRODUCTION_OVERVIEW_KPI_COLUMNS.map((col) => (
                    <li key={col.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`overview-kpi-${col.id}`}
                        checked={visibleColumns.includes(col.id)}
                        onCheckedChange={() => {
                          setVisibleColumns((prev) => toggleOverviewKpiColumn(prev, col.id));
                        }}
                      />
                      <Label htmlFor={`overview-kpi-${col.id}`} className="cursor-pointer font-normal">
                        {kpiLabel(col.id)}
                      </Label>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : !stats || stats.lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('noBatchWindow')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-2 font-medium">{t('line')}</th>
                    {columnMeta.map((col, idx) => (
                      <th
                        key={col.id}
                        className={cn(
                          'pb-2 px-2 text-right',
                          metricHeaderClass,
                          idx === columnMeta.length - 1 && 'pl-2',
                        )}
                      >
                        {kpiLabel(col.id)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.lines.map((line) => {
                    const expanded = expandedLineIds.has(line.production_line_id);
                    const colSpan = 1 + columnMeta.length;
                    return (
                      <React.Fragment key={line.production_line_id}>
                        <tr className="border-b border-border/60">
                          <td className="py-2.5 pr-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto max-w-full justify-start gap-1 px-1 py-0.5 font-medium"
                              onClick={() => toggleLine(line.production_line_id)}
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{line.line_name}</span>
                            </Button>
                          </td>
                          {columnMeta.map((col, idx) => (
                            <td
                              key={col.id}
                              className={cn(
                                'px-2 py-2.5 text-right tabular-nums',
                                idx === columnMeta.length - 1 && 'pl-2',
                              )}
                            >
                              {col.id === 'avg_start_lag_minutes'
                                ? renderStartLagCell(line, minuteUnit, (count) => t('lateCount', { count }))
                                : formatKpiCell(col.id, line, minuteUnit)}
                            </td>
                          ))}
                        </tr>
                        {expanded
                          ? line.recipes.map((recipe) => (
                              <tr
                                key={`${line.production_line_id}-${recipe.formula_id ?? 'simple'}`}
                                className="border-b border-border/40 bg-muted/15"
                              >
                                <td className="py-2 pl-8 pr-2 text-muted-foreground">{recipe.recipe_name}</td>
                                {columnMeta.map((col, idx) => (
                                  <td
                                    key={col.id}
                                    className={cn(
                                      'px-2 py-2 text-right tabular-nums',
                                      idx === columnMeta.length - 1 && 'pl-2',
                                    )}
                                  >
                                    {col.id === 'avg_start_lag_minutes'
                                      ? renderStartLagCell(recipe, minuteUnit, (count) => t('lateCount', { count }))
                                      : formatKpiCell(col.id, recipe, minuteUnit)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          : null}
                        {expanded
                          ? line.recipes.flatMap((recipe) =>
                              recipe.condition_drifts.length > 0
                                ? [
                                    <tr
                                      key={`drift-${line.production_line_id}-${recipe.formula_id ?? 'simple'}`}
                                      className="border-b border-border/30 bg-muted/10"
                                    >
                                      <td colSpan={colSpan} className="px-8 py-2 text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">{recipe.recipe_name}</span>
                                        {' · '}
                                        {recipe.condition_drifts
                                          .map((d) => {
                                            const unit = d.unit ? ` ${d.unit}` : '';
                                            const sign = d.avg_drift > 0 ? '+' : '';
                                            return `${d.label} ${sign}${d.avg_drift}${unit}`;
                                          })
                                          .join(' · ')}
                                      </td>
                                    </tr>,
                                  ]
                                : [],
                            )
                          : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('outliers')}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('outliersHint')}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
            </div>
          ) : !stats?.outliers.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('noneInWindow')}</p>
          ) : (
            <ul className="space-y-2">
              {stats.outliers.map((row) => (
                <li
                  key={`${row.batch_id}-${row.metric}`}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium text-foreground">{row.batch_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.line_name} · {row.recipe_name}
                  </p>
                  <p className="mt-1 text-xs tabular-nums">
                    {row.metric === 'yield' ? t('yield') : t('kpi_time_vs_plan_pct')}{' '}
                    <span
                      className={
                        row.delta_from_group >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }
                    >
                      {row.delta_from_group > 0 ? '+' : ''}
                      {row.delta_from_group.toFixed(1)} {t('vsGroupAvg')}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionOverviewByLine;
