import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetActiveOrdersForContextQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { buildWorkOrderHref } from '@/lib/entityLinks';
import type { Machine } from '@/types/machine';
import type { ActiveOrderRow } from '@/types/purchaseOrder';
import { ClipboardList, Loader2, Plus, Wrench } from 'lucide-react';

export interface MachineWorkOrdersPanelProps {
  machine: Machine;
}

function activeOrdersErrorMessage(error: unknown): string {
  const e = error as { status?: string | number; data?: { detail?: string } };
  if (e?.status === 'FETCH_ERROR') {
    return 'Cannot reach API — is the backend running on http://localhost:8000?';
  }
  if (typeof e?.data?.detail === 'string' && e.data.detail.trim()) {
    return e.data.detail;
  }
  return 'Failed to load work orders.';
}

function WorkOrderRow({ row, machineId }: { row: ActiveOrderRow; machineId: number }) {
  const statusLabel = row.status_name ?? `#${row.current_status_id}`;

  return (
    <li>
      <Link
        to={buildWorkOrderHref(row.id, { machineId })}
        className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium leading-snug text-card-foreground">
            {row.number}
          </span>
          <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-semibold tabular-nums">
            WO
          </Badge>
        </div>
        {row.summary ? (
          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">{row.summary}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="max-w-[55%] truncate">{statusLabel}</span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">#{row.id}</span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      </Link>
    </li>
  );
}

const MachineWorkOrdersPanel: React.FC<MachineWorkOrdersPanelProps> = ({ machine }) => {
  const [, setSearchParams] = useSearchParams();
  const { data = [], isLoading, isError, error } = useGetActiveOrdersForContextQuery({
    machineId: machine.id,
  });

  const workOrders = useMemo(
    () => data.filter((row) => row.order_kind === 'work'),
    [data],
  );

  const openWorkOrders = (options?: { addWork?: boolean }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'workOrders');
      next.set('woMachine', String(machine.id));
      if (options?.addWork) next.set('woAdd', '1');
      else next.delete('woAdd');
      return next;
    });
  };

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="space-y-0 p-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold leading-none">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Work Orders
            {workOrders.length > 0 ? (
              <Badge variant="outline" className="ml-0.5 font-normal tabular-nums">
                {workOrders.length}
              </Badge>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => openWorkOrders({ addWork: true })}
            >
              <Plus className="mr-1.5 h-4 w-4 shrink-0" />
              Add work
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openWorkOrders()}
            >
              <ClipboardList className="mr-1.5 h-4 w-4 shrink-0" />
              View all
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-brand-primary" />
            <p className="text-sm">Loading work orders…</p>
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {activeOrdersErrorMessage(error)}
          </div>
        ) : workOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-8 text-center">
            <ClipboardList className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No active work orders.</p>
            <Button
              type="button"
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => openWorkOrders({ addWork: true })}
            >
              <Plus className="mr-1.5 h-4 w-4 shrink-0" />
              Add work
            </Button>
          </div>
        ) : (
          <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {workOrders.map((row) => (
              <WorkOrderRow key={row.id} row={row} machineId={machine.id} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default MachineWorkOrdersPanel;
