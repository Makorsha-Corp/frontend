import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DueStatusRow } from './DueStatusCard';
import {
  maintenanceLocationLabel,
  maintenanceRowLinkClass,
  maintenanceStatusBadgeClass,
  parseMaintenanceContextLabel,
} from './maintenanceDialogUtils';

interface UpcomingMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  overdueRows?: DueStatusRow[];
  upcomingRows?: DueStatusRow[];
  rows?: DueStatusRow[];
  description?: string;
  emptyMessage?: string;
}

interface MaintenanceStatusBadgeProps {
  status: string;
}

const MaintenanceStatusBadge: React.FC<MaintenanceStatusBadgeProps> = ({ status }) => (
  <Badge
    variant="outline"
    className={cn('shrink-0 text-[10px] font-medium', maintenanceStatusBadgeClass(status))}
  >
    {status}
  </Badge>
);

interface MaintenanceDialogRowProps {
  row: DueStatusRow;
  onNavigate: () => void;
}

const MaintenanceDialogRow: React.FC<MaintenanceDialogRowProps> = ({ row, onNavigate }) => {
  const context = parseMaintenanceContextLabel(row.contextLabel);

  return (
    <li>
      <Link
        to={row.href}
        onClick={onNavigate}
        className={cn(maintenanceRowLinkClass, 'flex items-start gap-3 px-3 py-3')}
      >
        <span
          className={cn(
            'shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium tabular-nums',
            row.isOverdue
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-border/80 bg-muted/40 text-muted-foreground',
          )}
        >
          {row.isOverdue ? `${row.dateLabel} · overdue` : row.dateLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-card-foreground">{row.name}</span>
            <MaintenanceStatusBadge status={context.status} />
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {maintenanceLocationLabel(context)}
          </p>
        </div>
      </Link>
    </li>
  );
};

interface MaintenanceDialogSectionProps {
  title: string;
  rows: DueStatusRow[];
  onNavigate: () => void;
}

const MaintenanceDialogSection: React.FC<MaintenanceDialogSectionProps> = ({
  title,
  rows,
  onNavigate,
}) => {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <MaintenanceDialogRow key={row.id} row={row} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
};

const UpcomingMaintenanceDialog: React.FC<UpcomingMaintenanceDialogProps> = ({
  open,
  onOpenChange,
  loading = false,
  overdueRows = [],
  upcomingRows = [],
  rows,
  description = 'Overdue and upcoming draft work orders for the next 7 days.',
  emptyMessage = 'No overdue or upcoming machine work in the next 7 days.',
}) => {
  const handleNavigate = () => onOpenChange(false);
  const resolvedOverdueRows = rows?.filter((row) => row.isOverdue) ?? overdueRows;
  const resolvedUpcomingRows = rows?.filter((row) => !row.isOverdue) ?? upcomingRows;
  const hasRows = resolvedOverdueRows.length > 0 || resolvedUpcomingRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border bg-muted/25 px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 pr-8">
            <DialogTitle className="flex items-center gap-2.5 text-card-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/20">
                <Wrench className="h-4 w-4 text-brand-primary" />
              </span>
              Machine work due
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[min(58vh,440px)] overflow-y-auto bg-background px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <p className="text-sm">Loading machine work…</p>
            </div>
          ) : !hasRows ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Wrench className="h-10 w-10 text-muted-foreground/35" />
              <p className="text-sm font-medium text-card-foreground">Nothing due right now</p>
              <p className="max-w-xs text-xs text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <MaintenanceDialogSection
                title="Overdue"
                rows={resolvedOverdueRows}
                onNavigate={handleNavigate}
              />
              <MaintenanceDialogSection
                title="Due within 7 days"
                rows={resolvedUpcomingRows}
                onNavigate={handleNavigate}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpcomingMaintenanceDialog;
