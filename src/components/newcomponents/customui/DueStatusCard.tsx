import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DueStatusRow {
  id: string | number;
  machineId?: number | null;
  name: string;
  dateLabel: string;
  contextLabel: string;
  href: string;
  isOverdue?: boolean;
}

interface DueStatusCardProps {
  title?: string;
  loading?: boolean;
  rows?: DueStatusRow[];
  overdueRows?: DueStatusRow[];
  upcomingRows?: DueStatusRow[];
  emptyMessage?: string;
  className?: string;
}

interface DueStatusListProps {
  rows: DueStatusRow[];
}

const DueStatusList: React.FC<DueStatusListProps> = ({ rows }) => (
  <ul className="space-y-2">
    {rows.map((row) => (
      <li key={row.id}>
        <Link
          to={row.href}
          className={cn(
            'flex flex-wrap items-baseline justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:border-brand-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            row.isOverdue
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-border/80 bg-muted/20',
          )}
        >
          <span className="font-medium text-card-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.isOverdue ? `${row.dateLabel} · overdue` : row.dateLabel}
            <span className="mx-1.5 text-border">·</span>
            {row.contextLabel}
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

const DueStatusCard: React.FC<DueStatusCardProps> = ({
  title = 'Upcoming machine work',
  loading = false,
  rows,
  overdueRows = [],
  upcomingRows = [],
  emptyMessage = 'No upcoming machine work this week.',
  className,
}) => {
  const resolvedOverdueRows = rows?.filter((row) => row.isOverdue) ?? overdueRows;
  const resolvedUpcomingRows = rows?.filter((row) => !row.isOverdue) ?? upcomingRows;
  const hasSplitSections = rows == null;
  const hasRows = resolvedOverdueRows.length > 0 || resolvedUpcomingRows.length > 0;

  return (
    <Card className={`flex h-full min-h-0 flex-col border-border bg-card shadow-sm ${className ?? ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-card-foreground">
          <Wrench className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : !hasRows ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : hasSplitSections ? (
          <div className="space-y-4">
            {resolvedOverdueRows.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Overdue
                </h3>
                <DueStatusList rows={resolvedOverdueRows} />
              </div>
            ) : null}
            {resolvedUpcomingRows.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Due within 7 days
                </h3>
                <DueStatusList rows={resolvedUpcomingRows} />
              </div>
            ) : null}
          </div>
        ) : (
          <DueStatusList rows={rows ?? []} />
        )}
      </CardContent>
    </Card>
  );
};

export default DueStatusCard;
