import React from 'react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ContributionHeatmapProps {
  /** Items with a date field (ISO date string or YYYY-MM-DD). Counts are aggregated by date. */
  items: Array<{ date: string }>;
  /** How many months to show (default 12) */
  monthsBack?: number;
  /** Singular label for tooltip (e.g. "batch", "order", "event"). Default: "item" */
  itemLabel?: string;
  /** Optional class for the container */
  className?: string;
}

/**
 * GitHub-style contribution heatmap. Rows = days of week, columns = weeks.
 * Reusable for any date-based activity (batches, orders, events, etc.).
 */
export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  items,
  monthsBack = 12,
  itemLabel = 'item',
  className,
}) => {
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
      const week: { date: string; count: number }[] = [];
      const weekMonth = current.getMonth();
      const weekInRange = current >= start;
      if (weekInRange && weekMonth !== lastMonth) {
        monthLabels.push({ col: weeks.length, label: current.toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = weekMonth;
      }
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

  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-brand-primary" />
        </div>
        <span>More</span>
      </div>
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAY_LABELS.map((label) => (
            <div key={label} className="h-3 text-[10px] text-muted-foreground leading-3">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 min-w-0">
          {grid.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 shrink-0">
              {week.map((cell, rowIdx) => (
                <div
                  key={`${colIdx}-${rowIdx}`}
                  className={`w-3 h-3 rounded-sm cursor-default transition-colors ${getColor(cell.count)}`}
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
      {monthLabels.length > 0 && (
        <div
          className="relative mt-1 ml-8 text-[10px] text-muted-foreground h-4"
          style={{ width: grid.length * 14 }}
        >
          {monthLabels.map(({ col, label }) => (
            <span
              key={`${col}-${label}`}
              className="absolute whitespace-nowrap"
              style={{ left: col * 14 }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-popover border border-border rounded shadow-md pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 28 }}
        >
          {tooltip.date}: {tooltip.count} {pluralize(tooltip.count)}
        </div>
      )}
    </div>
  );
};
