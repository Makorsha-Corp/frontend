import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';
import { machineStatusSegmentClass, type MachineVisualKind } from '@/lib/machineVisualStatus';
import DueStatusCard from './DueStatusCard';
import { useGetUpcomingMachineWorkQuery } from '@/features/machines/machinesApi';
import { splitUpcomingWorkByDueWindow } from '@/lib/machineUpcomingWork';

export interface FactoryMachinesStatusPanelProps {
  factory: Pick<Factory, 'id' | 'name' | 'abbreviation'>;
  machines: Machine[];
  machinesLoading: boolean;
  sections: FactorySection[];
}

type StatusBucket = 'active' | 'maintenance' | 'stoppedIdle';

function bucketForMachine(m: Machine): StatusBucket {
  if (m.is_running) return 'active';
  if (m.latest_status_type === 'MAINTENANCE') return 'maintenance';
  return 'stoppedIdle';
}

export const FactoryMachinesStatusPanel: React.FC<FactoryMachinesStatusPanelProps> = ({
  factory,
  machines,
  machinesLoading,
  sections,
}) => {
  const sectionById = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);

  const { data: upcomingWork = [], isLoading: loadUpcomingWork } = useGetUpcomingMachineWorkQuery({
    within_days: 7,
    factory_id: factory.id,
    include_overdue: true,
  });

  const splitWork = useMemo(
    () => splitUpcomingWorkByDueWindow(upcomingWork, sectionById, 7, factory.abbreviation),
    [upcomingWork, sectionById, factory.abbreviation]
  );

  const counts = useMemo(() => {
    let active = 0;
    let maintenance = 0;
    let stoppedIdle = 0;
    for (const m of machines) {
      const b = bucketForMachine(m);
      if (b === 'active') active += 1;
      else if (b === 'maintenance') maintenance += 1;
      else stoppedIdle += 1;
    }
    return { active, maintenance, stoppedIdle, total: machines.length };
  }, [machines]);

  const segments: { key: StatusBucket; label: string; count: number; segmentKind: MachineVisualKind }[] = [
    { key: 'active', label: 'Active', count: counts.active, segmentKind: 'running' },
    { key: 'maintenance', label: 'Maintenance', count: counts.maintenance, segmentKind: 'maintenance' },
    { key: 'stoppedIdle', label: 'Stopped / idle', count: counts.stoppedIdle, segmentKind: 'stopped' },
  ];

  const pct = (n: number) => (counts.total > 0 ? Math.round((n / counts.total) * 1000) / 10 : 0);
  const dueLoading = loadUpcomingWork;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="flex h-full min-h-0 flex-col border-border bg-card shadow-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="min-w-0 text-lg font-semibold tracking-tight text-card-foreground">
              Machine status
            </CardTitle>
            {machinesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {counts.total} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 pt-0">
          {machinesLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading machines…
            </div>
          ) : counts.total === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No machines in this factory.</p>
          ) : (
            <>
              <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-muted">
                {segments.map((segment) =>
                  segment.count > 0 ? (
                    <div
                      key={segment.key}
                      className={cn('h-full min-w-[2px]', machineStatusSegmentClass[segment.segmentKind])}
                      style={{ width: `${pct(segment.count)}%` }}
                      title={`${segment.label}: ${segment.count}`}
                    />
                  ) : null
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                {segments.map((segment) => (
                  <div key={segment.key}>
                    <p className="text-xl font-semibold tabular-nums text-card-foreground">
                      {segment.count}
                    </p>
                    <p className="text-xs text-muted-foreground">{segment.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DueStatusCard
        title="Machine work due"
        loading={dueLoading}
        overdueRows={splitWork.overdueRows}
        upcomingRows={splitWork.upcomingRows}
        emptyMessage="No overdue or upcoming machine work in the next 7 days."
      />
    </div>
  );
};

export default FactoryMachinesStatusPanel;
