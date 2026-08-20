import React, { useLayoutEffect, useRef, useState } from 'react';
import { CirclePause, CirclePlay, Cog, Loader2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FactoryModuleInfoCard, {
  factoryModuleInfoCardBodyClasses,
} from '@/components/newcomponents/customui/factories/overview/FactoryModuleInfoCard';
import type { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';
import type { MachineStatusCounts } from '@/pages/newpages/factories/factoriesOverviewData';
import { factoryHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';
import {
  iterateMonthCellRowFit,
  overflowProbeCount,
} from '@/pages/newpages/calendar/monthCellChipFit';
import {
  machineListTopBarClass,
  type MachineVisualKind,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';

interface FactoriesUnifiedMachineCardProps {
  scopeLabel: string;
  factoryFilter: string;
  machineStatus: MachineStatusCounts;
  overdueCount: number;
  upcomingCount: number;
  overdueRows: DueStatusRow[];
  upcomingRows: DueStatusRow[];
  machinesLoading?: boolean;
  onMaintenanceClick: () => void;
  className?: string;
}

const CARD_VARIANT = 'primary' as const;
const CHIP_GAP_PX = 6;
const OVERFLOW_PROBE_COUNTS = [1, 9, 99, 999, 9999] as const;

const innerPanelClass =
  'overflow-hidden rounded-lg border border-white/10 bg-[hsl(266_45%_42%/0.55)] transition-colors';
const innerPanelInteractiveClass =
  'cursor-pointer hover:bg-[hsl(266_45%_38%/0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30';
const previewChipClass = 'border-white/10 bg-[hsl(266_45%_38%/0.5)] text-white';
const innerIconTileClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(266_45%_36%/0.65)] ring-1 ring-white/15';
const maintenanceDueBadgeClass = 'border-amber-200/50 bg-amber-400/20 text-white';
const maintenanceOverdueBadgeClass = 'border-red-200/50 bg-red-500/20 text-white';
const previewChipOverdueClass = 'border-red-300/30 bg-red-950/35 text-white';

const statusAccentClass: Record<MachineVisualKind, string> = {
  running: 'text-emerald-200',
  idle: 'text-purple-100',
  off: 'text-red-200',
  maintenance: 'text-amber-200',
};

function getPreviewStatusLabel(contextLabel: string): string {
  const parts = contextLabel.split(' · ');
  return parts[2] ?? parts[parts.length - 1] ?? contextLabel;
}

function readChipWidths(row: HTMLElement | null): number[] {
  if (!row) return [];
  return Array.from(row.children).map((child) => child.getBoundingClientRect().width);
}

interface MachineStatusCellProps {
  count: number;
  label: string;
  segmentKind: MachineVisualKind;
  icon: React.ReactNode;
  labelClassName: string;
}

const MachineStatusCell: React.FC<MachineStatusCellProps> = ({
  count,
  label,
  segmentKind,
  icon,
  labelClassName,
}) => (
  <div className={innerPanelClass}>
    <div className={cn('h-1', machineListTopBarClass[segmentKind])} aria-hidden />
    <div className="px-2 py-2 text-center">
      <div className="mb-1 flex justify-center opacity-90">{icon}</div>
      <p
        className={cn(
          'text-base font-bold tabular-nums',
          statusAccentClass[segmentKind],
          count === 0 && 'opacity-60',
        )}
      >
        {count}
      </p>
      <p className={cn('text-[10px]', labelClassName)}>{label}</p>
    </div>
  </div>
);

interface MaintenanceDueChipProps {
  row: DueStatusRow;
}

const MaintenanceDueChip: React.FC<MaintenanceDueChipProps> = ({ row }) => (
  <div
    className={cn(
      'w-[7.25rem] max-w-[8.75rem] shrink-0 rounded-md border px-2 py-1',
      row.isOverdue ? previewChipOverdueClass : previewChipClass,
    )}
  >
    <p className="truncate text-[11px] font-medium leading-tight">
      {row.isOverdue ? `${row.dateLabel} · overdue` : row.dateLabel}
    </p>
    <p className="truncate text-[10px] leading-tight text-white/65">
      {getPreviewStatusLabel(row.contextLabel)}
    </p>
  </div>
);

interface MaintenanceOverflowChipProps {
  count: number;
}

const MaintenanceOverflowChip: React.FC<MaintenanceOverflowChipProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <div
      className={cn(
        'flex h-[2.25rem] w-10 shrink-0 items-center justify-center self-center rounded-md border text-[11px] font-semibold tabular-nums text-white/85',
        previewChipClass,
      )}
    >
      +{count}
    </div>
  );
};

interface MaintenanceDueChipRowProps {
  rows: DueStatusRow[];
}

const MaintenanceDueChipRow: React.FC<MaintenanceDueChipRowProps> = ({ rows }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitPlan, setFitPlan] = useState(() => ({
    visibleCount: rows.length,
    overflowCount: 0,
  }));

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measureRoot = measureRef.current;
    if (!container || !measureRoot || rows.length === 0) return;

    const measure = () => {
      const measureRow = measureRoot.querySelector<HTMLElement>('[data-measure-row]');
      const chipWidths = readChipWidths(measureRow);
      const availableWidth = container.clientWidth;

      const overflowWidthForCount = (count: number) => {
        const probe = measureRoot.querySelector<HTMLElement>(
          `[data-measure-overflow="${overflowProbeCount(count)}"]`,
        );
        return probe?.getBoundingClientRect().width ?? 40;
      };

      const plan = iterateMonthCellRowFit(
        [{ chipWidths, availableWidth }],
        rows.length,
        overflowWidthForCount,
        CHIP_GAP_PX,
      );

      setFitPlan({
        visibleCount: plan.visiblePerRow[0] ?? 0,
        overflowCount: plan.overflowCount,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, [rows]);

  const visibleRows = rows.slice(0, fitPlan.visibleCount);

  return (
    <div className="relative min-w-0">
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute h-0 w-full overflow-hidden"
      >
        <div data-measure-row className="flex w-full flex-nowrap gap-1.5">
          {rows.map((row) => (
            <MaintenanceDueChip key={`measure-${row.id}`} row={row} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {OVERFLOW_PROBE_COUNTS.map((probeCount) => (
            <div key={probeCount} data-measure-overflow={probeCount} className="inline-flex">
              <MaintenanceOverflowChip count={probeCount} />
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex min-w-0 flex-nowrap items-stretch gap-1.5 overflow-hidden"
      >
        {visibleRows.map((row) => (
          <MaintenanceDueChip key={row.id} row={row} />
        ))}
        {fitPlan.overflowCount > 0 ? (
          <MaintenanceOverflowChip count={fitPlan.overflowCount} />
        ) : null}
      </div>
    </div>
  );
};

const FactoriesUnifiedMachineCard: React.FC<FactoriesUnifiedMachineCardProps> = ({
  scopeLabel,
  factoryFilter,
  machineStatus,
  overdueCount,
  upcomingCount,
  overdueRows,
  upcomingRows,
  machinesLoading,
  onMaintenanceClick,
  className,
}) => {
  const body = factoryModuleInfoCardBodyClasses(CARD_VARIANT);
  const machinesHref = factoryHubLink('/machines', factoryFilter);
  const previewRows = [...overdueRows, ...upcomingRows];
  const hasAlert = overdueCount > 0 || upcomingCount > 0;

  const handleMaintenanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMaintenanceClick();
  };

  return (
    <FactoryModuleInfoCard
      title="Machines"
      icon={Cog}
      href={machinesHref}
      scopeLabel={scopeLabel}
      headline={machineStatus.total}
      subtitle="Total in scope"
      variant={CARD_VARIANT}
      hasAlert={hasAlert}
      compactHeader
      className={className}
    >
      <div className="grid grid-cols-4 gap-1 text-sm">
        <MachineStatusCell
          count={machineStatus.running}
          label="Running"
          segmentKind="running"
          icon={<CirclePlay className={cn('h-3.5 w-3.5', statusAccentClass.running)} aria-hidden />}
          labelClassName={body.bodyMuted}
        />
        <MachineStatusCell
          count={machineStatus.idle}
          label="Idle"
          segmentKind="idle"
          icon={<CirclePause className={cn('h-3.5 w-3.5', statusAccentClass.idle)} aria-hidden />}
          labelClassName={body.bodyMuted}
        />
        <MachineStatusCell
          count={machineStatus.off}
          label="Off"
          segmentKind="off"
          icon={<CirclePause className={cn('h-3.5 w-3.5', statusAccentClass.off)} aria-hidden />}
          labelClassName={body.bodyMuted}
        />
        <MachineStatusCell
          count={machineStatus.maintenance}
          label="Maint."
          segmentKind="maintenance"
          icon={<Wrench className={cn('h-3.5 w-3.5', statusAccentClass.maintenance)} aria-hidden />}
          labelClassName={body.bodyMuted}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="View overdue and upcoming machine work"
        onClick={handleMaintenanceClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMaintenanceClick(e as unknown as React.MouseEvent);
          }
        }}
        className={cn(innerPanelClass, innerPanelInteractiveClass, 'space-y-1.5 px-2.5 py-2 text-left')}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={innerIconTileClass} aria-hidden>
              <Wrench className="h-3.5 w-3.5 text-white/90" />
            </span>
            <span className={cn('text-[11px] font-medium uppercase tracking-wide', body.bodySectionLabel)}>
              Work due
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {overdueCount > 0 ? (
              <Badge variant="outline" className={maintenanceOverdueBadgeClass}>
                {overdueCount} overdue
              </Badge>
            ) : null}
            {upcomingCount > 0 ? (
              <Badge variant="outline" className={maintenanceDueBadgeClass}>
                {upcomingCount} due (7d)
              </Badge>
            ) : null}
          </div>
        </div>

        {machinesLoading ? (
          <div className={cn('flex items-center gap-2 text-xs', body.bodyMuted)}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        ) : previewRows.length === 0 ? (
          <p className={cn('text-xs', body.bodyMuted)}>
            No overdue or upcoming machine work in the next 7 days.
          </p>
        ) : (
          <MaintenanceDueChipRow rows={previewRows} />
        )}
      </div>
    </FactoryModuleInfoCard>
  );
};

export default FactoriesUnifiedMachineCard;
