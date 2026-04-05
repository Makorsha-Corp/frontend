import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wrench } from 'lucide-react';
import { machinesApi } from '@/features/machines/machinesApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store';
import type { Machine } from '@/types/machine';
import type { MachineEvent } from '@/types/machine';
import { cn } from '@/lib/utils';

export interface FactoryMachinesStatusPanelProps {
  factoryId: number;
  machines: Machine[];
  machinesLoading: boolean;
  sectionNameById: Map<number, string>;
}

type StatusBucket = 'active' | 'maintenance' | 'stoppedIdle';

function bucketForMachine(m: Machine, latest: MachineEvent | undefined): StatusBucket {
  if (m.is_running) return 'active';
  if (latest?.event_type === 'MAINTENANCE') return 'maintenance';
  return 'stoppedIdle';
}

export const FactoryMachinesStatusPanel: React.FC<FactoryMachinesStatusPanelProps> = ({
  factoryId,
  machines,
  machinesLoading,
  sectionNameById,
}) => {
  const dispatch = useAppDispatch();

  const nonRunningIds = useMemo(
    () => machines.filter((m) => !m.is_running).map((m) => m.id),
    [machines]
  );

  const nonRunningKey = useMemo(() => [...nonRunningIds].sort((a, b) => a - b).join(','), [nonRunningIds]);

  useEffect(() => {
    const ids = nonRunningKey ? nonRunningKey.split(',').map(Number) : [];
    if (ids.length === 0) return;
    const results = ids.map((id) => dispatch(machinesApi.endpoints.getLatestMachineEvent.initiate(id)));
    return () => {
      results.forEach((r) => {
        const u = r as { unsubscribe?: () => void };
        if (typeof u.unsubscribe === 'function') u.unsubscribe();
      });
    };
  }, [dispatch, nonRunningKey]);

  const latestByMachineId = useAppSelector((state: RootState) => {
    const out: Record<number, MachineEvent | undefined> = {};
    for (const id of nonRunningIds) {
      const slice = machinesApi.endpoints.getLatestMachineEvent.select(id)(state);
      out[id] = slice.data ?? undefined;
    }
    return out;
  });

  const latestPending = useAppSelector((state: RootState) => {
    if (nonRunningIds.length === 0) return false;
    return nonRunningIds.some((id) => {
      const r = machinesApi.endpoints.getLatestMachineEvent.select(id)(state);
      return r.isLoading || r.status === 'uninitialized';
    });
  });

  const counts = useMemo(() => {
    let active = 0;
    let maintenance = 0;
    let stoppedIdle = 0;
    for (const m of machines) {
      const latest = latestByMachineId[m.id];
      const b = bucketForMachine(m, latest);
      if (b === 'active') active += 1;
      else if (b === 'maintenance') maintenance += 1;
      else stoppedIdle += 1;
    }
    return { active, maintenance, stoppedIdle, total: machines.length };
  }, [machines, latestByMachineId]);

  const maintenanceRows = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return machines
      .filter((m) => {
        if (!m.next_maintenance_schedule) return false;
        const d = new Date(m.next_maintenance_schedule);
        return !Number.isNaN(d.getTime()) && d <= horizon;
      })
      .sort(
        (a, b) =>
          new Date(a.next_maintenance_schedule!).getTime() -
          new Date(b.next_maintenance_schedule!).getTime()
      );
  }, [machines]);

  const segments: { key: StatusBucket; label: string; count: number; className: string }[] = [
    { key: 'active', label: 'Active', count: counts.active, className: 'bg-emerald-500' },
    { key: 'maintenance', label: 'Maintenance', count: counts.maintenance, className: 'bg-amber-500' },
    { key: 'stoppedIdle', label: 'Stopped / idle', count: counts.stoppedIdle, className: 'bg-red-500' },
  ];

  const pct = (n: number) => (counts.total > 0 ? Math.round((n / counts.total) * 1000) / 10 : 0);

  return (
    <Card className="flex h-full min-h-0 flex-col border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 text-lg font-semibold tracking-tight text-card-foreground">
            Machine Statuses
          </CardTitle>
          {latestPending && nonRunningIds.length > 0 ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Syncing…
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 pt-0">
        {machinesLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading machines…
          </div>
        ) : counts.total === 0 ? (
          <p className="flex-1 py-6 text-center text-sm text-muted-foreground">
            No machines in this factory yet. Add machines from a section.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              <div
                className="flex h-4 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`Machines: ${counts.active} active, ${counts.maintenance} in maintenance, ${counts.stoppedIdle} stopped or idle of ${counts.total}`}
              >
                {segments.map(
                  (s) =>
                    s.count > 0 && (
                      <div
                        key={s.key}
                        className={cn(s.className, 'h-full min-w-[6px] transition-[width] duration-300')}
                        style={{ width: `${pct(s.count)}%` }}
                        title={`${s.label}: ${s.count}`}
                      />
                    )
                )}
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {segments.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.className)} aria-hidden />
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold tabular-nums text-card-foreground">{s.count}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">({pct(s.count)}%)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto border-t border-border pt-5">
              <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Wrench className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                Due within 7 days
              </p>
              {maintenanceRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled this week.</p>
              ) : (
                <ul className="space-y-2">
                  {maintenanceRows.map((m) => {
                    const d = m.next_maintenance_schedule
                      ? new Date(m.next_maintenance_schedule).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';
                    const sectionName = sectionNameById.get(m.factory_section_id) ?? `Section ${m.factory_section_id}`;
                    return (
                      <li key={m.id}>
                        <Link
                          to={`/factories/${factoryId}/sections/${m.factory_section_id}`}
                          className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm transition-colors hover:border-brand-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                          <span className="font-medium text-card-foreground">{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {d}
                            <span className="mx-1.5 text-border">·</span>
                            {sectionName}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FactoryMachinesStatusPanel;
