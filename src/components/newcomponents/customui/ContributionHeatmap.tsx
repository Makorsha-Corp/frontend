import React, { useLayoutEffect, useRef } from 'react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** w-3 (12px) + gap-0.5 (2px) between week columns */
const COL_STRIDE_PX = 14;

export interface ContributionHeatmapProps {
  /** Items with a date field (ISO date string or YYYY-MM-DD). Counts are aggregated by date. */
  items: Array<{ date: string }>;
  /** How many months to show (default 12) */
  monthsBack?: number;
  /** Singular label for tooltip (e.g. "batch", "order", "event"). Default: "item" */
  itemLabel?: string;
  /** Optional class for the container */
  className?: string;
  /**
   * When true (default), scroll the chart horizontally so the most recent week is visible on load
   * (right side), e.g. when a sidebar reduces viewport width.
   */
  scrollToEndOnMount?: boolean;
}

/**
 * GitHub-style contribution heatmap. Rows = days of week, columns = weeks.
 * Month labels on top with weekday labels fixed on the left.
 */
export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  items,
  monthsBack = 12,
  itemLabel = 'item',
  className,
  scrollToEndOnMount = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { grid, maxCount, monthLabels } = React.useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setMonth(start.getMonth() - (monthsBack - 1));
    start.setDate(1);

    const countByDate: Record<string, number> = {};
    for (const item of items) {
      const d = new Date(item.date);
      if (d >= start && d <= end) {
        const key = d.toISOString().split('T')[0];
        countByDate[key] = (countByDate[key] ?? 0) + 1;
      }
    }

    const maxCount = Math.max(1, ...Object.values(countByDate));

    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weeks: { date: string; count: number }[][] = [];
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    let current = new Date(weekStart);

    while (current <= end || weeks.length < 53) {
      const weekMonth = current.getMonth();
      const weekInRange = current >= start;
      if (weekInRange && weekMonth !== lastMonth) {
        monthLabels.push({ col: weeks.length, label: current.toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = weekMonth;
      }
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = current.toISOString().split('T')[0];
        week.push({ date: dateKey, count: countByDate[dateKey] ?? 0 });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > end && weeks.length >= 12) break;
    }

    return { grid: weeks, maxCount, monthLabels };
  }, [items, monthsBack]);

  useLayoutEffect(() => {
    if (!scrollToEndOnMount) return;
    const el = scrollRef.current;
    if (!el) return;
    const run = () => {
      el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    };
    run();
    requestAnimationFrame(run);
    const ro = new ResizeObserver(() => requestAnimationFrame(run));
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid.length, monthsBack, scrollToEndOnMount]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    const intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
    const shades = [
      'bg-brand-primary/20',
      'bg-brand-primary/40',
      'bg-brand-primary/60',
      'bg-brand-primary',
    ];
    return shades[intensity - 1];
  };

  const pluralize = (n: number) => (n === 1 ? itemLabel : `${itemLabel}s`);

  const [tooltip, setTooltip] = React.useState<{ date: string; count: number; x: number; y: number } | null>(null);

  const gridWidthPx = grid.length * COL_STRIDE_PX;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <div className="h-3 w-3 rounded-sm bg-brand-primary/20" />
          <div className="h-3 w-3 rounded-sm bg-brand-primary/40" />
          <div className="h-3 w-3 rounded-sm bg-brand-primary/60" />
          <div className="h-3 w-3 rounded-sm bg-brand-primary" />
        </div>
        <span>More</span>
      </div>

      <div className="flex gap-1">
        <div className="shrink-0">
          <div className="mb-1 h-4" aria-hidden />
          <div className="flex flex-col gap-0.5">
            {DAY_LABELS.map((label) => (
              <div key={label} className="h-3 text-[10px] leading-3 text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="max-w-full overflow-x-auto pb-1">
          <div className="inline-block min-w-0 align-top">
            {monthLabels.length > 0 && (
              <div className="relative mb-1 h-4 text-[10px] text-muted-foreground" style={{ width: Math.max(0, gridWidthPx - 2) }}>
                {monthLabels.map(({ col, label }) => (
                  <span
                    key={`${col}-${label}`}
                    className="absolute whitespace-nowrap"
                    style={{ left: col * COL_STRIDE_PX }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex min-w-0 gap-0.5">
              {grid.map((week, colIdx) => (
                <div key={colIdx} className="flex shrink-0 flex-col gap-0.5">
                  {week.map((cell, rowIdx) => (
                    <div
                      key={`${colIdx}-${rowIdx}`}
                      className={`h-3 w-3 cursor-default rounded-sm transition-colors ${getColor(cell.count)}`}
                      title={`${cell.date}: ${cell.count} ${pluralize(cell.count)}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-border bg-popover px-2 py-1 text-xs shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 28 }}
        >
          {tooltip.date}: {tooltip.count} {pluralize(tooltip.count)}
        </div>
      )}
    </div>
  );
};
