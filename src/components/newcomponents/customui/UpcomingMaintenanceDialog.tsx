import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Wrench } from 'lucide-react';
import type { DueStatusRow } from './DueStatusCard';

interface UpcomingMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  rows: DueStatusRow[];
  emptyMessage?: string;
}

const UpcomingMaintenanceDialog: React.FC<UpcomingMaintenanceDialogProps> = ({
  open,
  onOpenChange,
  loading = false,
  rows,
  emptyMessage = 'No machines due within 7 days across factories.',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <Wrench className="h-5 w-5 text-brand-primary" />
            Upcoming maintenance
          </DialogTitle>
          <DialogDescription>
            Machines scheduled for maintenance within the next 7 days across all factories.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="max-h-[min(60vh,420px)] space-y-2 overflow-y-auto pr-1">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={row.href}
                  onClick={() => onOpenChange(false)}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm transition-colors hover:border-brand-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      </DialogContent>
    </Dialog>
  );
};

export default UpcomingMaintenanceDialog;
