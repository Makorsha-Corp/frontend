import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench } from 'lucide-react';

export interface DueStatusRow {
  id: number;
  name: string;
  dateLabel: string;
  contextLabel: string;
  href: string;
}

interface DueStatusCardProps {
  title?: string;
  loading?: boolean;
  rows: DueStatusRow[];
  emptyMessage?: string;
  className?: string;
}

const DueStatusCard: React.FC<DueStatusCardProps> = ({
  title = 'Due within 7 days',
  loading = false,
  rows,
  emptyMessage = 'Nothing scheduled this week.',
  className,
}) => {
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
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={row.href}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm transition-colors hover:border-brand-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <span className="font-medium text-card-foreground">{row.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.dateLabel}
                    <span className="mx-1.5 text-border">·</span>
                    {row.contextLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default DueStatusCard;
