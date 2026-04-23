import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { machinesApi } from '@/features/machines/machinesApi';
import { createSelector } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store';
import type { Machine } from '@/types/machine';
import type { MachineEvent } from '@/types/machine';
import { cn } from '@/lib/utils';
import DueStatusCard, { DueStatusRow } from './DueStatusCard';

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

  const selectLatestByMachineId = useMemo(
    () =>
      createSelector(
        [(state: RootState) => state],
        (state) => {
          const out: Record<number, MachineEvent | undefined> = {};
          for (const id of nonRunningIds) {
            const slice = machinesApi.endpoints.getLatestMachineEvent.select(id)(state);
            out[id] = slice.data ?? undefined;
          }
          return out;
        }
      ),
    [nonRunningIds]
  );

  const latestByMachineId = useAppSelector(selectLatestByMachineId);

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

  const dueRows: DueStatusRow[] = useMemo(
    () =>
      maintenanceRows.map((m) => {
        const d = m.next_maintenance_schedule
          ? new Date(m.next_maintenance_schedule).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '—';
        const sectionName = sectionNameById.get(m.factory_section_id) ?? `Section ${m.factory_section_id}`;
        return {
          id: m.id,
          name: m.name,
          dateLabel: d,
          contextLabel: sectionName,
          href: `/factories/${factoryId}/sections/${m.factory_section_id}`,
        };
      }),
    [maintenanceRows, sectionNameById, factoryId]
  );

  const segments: { key: StatusBucket; label: string; count: number; className: string }[] = [
    { key: 'active', label: 'Active', count: counts.active, className: 'bg-emerald-500' },
    { key: 'maintenance', label: 'Maintenance', count: counts.maintenance, className: 'bg-amber-500' },
    { key: 'stoppedIdle', label: 'Stopped / idle', count: counts.stoppedIdle, className: 'bg-red-500' },
  ];

  const pct = (n: number) => (counts.total > 0 ? Math.round((n / counts.total) * 1000) / 10 : 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="flex h-full min-h-0 flex-col border-border bg-card shadow-sm lg:col-span-2">
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
        <CardContent className="flex flex-1 flex-col gap-4 pt-0">
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
          )}
        </CardContent>
      </Card>

      <DueStatusCard loading={machinesLoading} rows={dueRows} />
    </div>
  );
};

export default FactoryMachinesStatusPanel;
