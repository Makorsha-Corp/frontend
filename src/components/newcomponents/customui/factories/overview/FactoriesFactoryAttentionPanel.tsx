import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  factoryAttentionHasItems,
  type FactoryAttentionGroups,
} from '@/pages/newpages/factories/factoriesOverviewData';

interface FactoriesFactoryAttentionPanelProps {
  attention: FactoryAttentionGroups;
  loading?: boolean;
  className?: string;
}

const AttentionSection: React.FC<{
  title: string;
  rows: Array<{
    id: string | number;
    name: string;
    contextLabel: string;
    href: string;
    dateLabel?: string;
  }>;
}> = ({ title, rows }) => {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={String(row.id)}>
            <Link
              to={row.href}
              className="block rounded-md border border-border/70 bg-background px-2.5 py-2 transition-colors hover:border-brand-primary/30 hover:bg-muted/30"
            >
              <p className="truncate text-sm font-medium text-card-foreground">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.contextLabel}
                {row.dateLabel ? ` · ${row.dateLabel}` : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FactoriesFactoryAttentionPanel: React.FC<FactoriesFactoryAttentionPanelProps> = ({
  attention,
  loading,
  className,
}) => {
  const hasItems = factoryAttentionHasItems(attention);

  return (
    <Card className={`flex h-full min-h-0 flex-col border-border bg-card shadow-sm ${className ?? ''}`}>
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-card-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          Needs attention
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : !hasItems ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing needs attention.</p>
        ) : (
          <div className="space-y-4">
            <AttentionSection title="Machine work due" rows={attention.maintenanceDue} />
            <AttentionSection title="Idle" rows={attention.idle} />
            <AttentionSection title="Off" rows={attention.off} />
            <AttentionSection title="Unassigned machines" rows={attention.unassigned} />
            <AttentionSection title="Draft batches" rows={attention.draftBatches} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FactoriesFactoryAttentionPanel;
