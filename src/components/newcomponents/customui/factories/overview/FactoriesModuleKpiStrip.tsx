import React from 'react';
import { Link } from 'react-router-dom';
import { Cog, Package, Warehouse } from 'lucide-react';

import { factoryHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';
import type {
  MachineStatusCounts,
  ProductionCardSnapshot,
  StorageCardSnapshot,
} from '@/pages/newpages/factories/factoriesOverviewData';
import { cn } from '@/lib/utils';

interface FactoriesModuleKpiStripProps {
  factoryFilter: string;
  machineStatus: MachineStatusCounts;
  overdueCount: number;
  upcomingCount: number;
  storageSnapshot: StorageCardSnapshot;
  productionSnapshot: ProductionCardSnapshot;
  machinesLoading?: boolean;
  storageLoading?: boolean;
  productionLoading?: boolean;
}

interface KpiCellProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  subLabel: string;
  hasAlert?: boolean;
  variant?: 'primary' | 'primaryHover' | 'accent';
}

const variantClass: Record<NonNullable<KpiCellProps['variant']>, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover',
  primaryHover: 'bg-brand-primary-hover text-white hover:opacity-95',
  accent: 'bg-brand-accent text-card-foreground hover:opacity-95 dark:text-accent-foreground',
};

function KpiCell({
  to,
  label,
  icon,
  value,
  subLabel,
  hasAlert = false,
  variant = 'primary',
}: KpiCellProps) {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex min-w-0 flex-col rounded-lg border border-transparent p-3 shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variantClass[variant],
        hasAlert && variant === 'primary' && 'ring-1 ring-amber-300/30',
        hasAlert && variant === 'accent' && 'ring-1 ring-amber-400/40',
      )}
    >
      {hasAlert ? (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400"
          aria-hidden
        />
      ) : null}
      <div className="mb-1 flex items-center gap-1.5">
        <span className="opacity-80">{icon}</span>
        <span className="truncate text-[10px] font-medium uppercase tracking-wide opacity-75">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 truncate text-[10px] opacity-75">{subLabel}</p>
    </Link>
  );
}

const FactoriesModuleKpiStrip: React.FC<FactoriesModuleKpiStripProps> = ({
  factoryFilter,
  machineStatus,
  overdueCount,
  upcomingCount,
  storageSnapshot,
  productionSnapshot,
  machinesLoading,
  storageLoading,
  productionLoading,
}) => {
  const maintenanceAlert = overdueCount + upcomingCount > 0;
  const productionAlert = productionSnapshot.inProgressCount > 0;

  const storageUnitLabel =
    storageSnapshot.totalUnits === 1
      ? '1 unit'
      : `${storageSnapshot.totalUnits.toLocaleString()} units`;

  const productionLineLabel =
    productionSnapshot.activeLineCount === 1
      ? '1 active line'
      : `${productionSnapshot.activeLineCount} active lines`;

  return (
    <div className="grid grid-cols-3 gap-2 lg:hidden">
      <KpiCell
        to={factoryHubLink('/machines', factoryFilter)}
        label="Machines"
        icon={<Cog className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        value={machinesLoading ? '—' : machineStatus.total}
        subLabel="in scope"
        hasAlert={maintenanceAlert}
        variant="primary"
      />
      <KpiCell
        to={factoryHubLink('/storage', factoryFilter)}
        label="Storage"
        icon={<Warehouse className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        value={storageLoading ? '—' : storageSnapshot.skusWithStock}
        subLabel={storageLoading ? 'Loading…' : storageUnitLabel}
        variant="primaryHover"
      />
      <KpiCell
        to={factoryHubLink('/production', factoryFilter)}
        label="Production"
        icon={<Package className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        value={productionLoading ? '—' : productionSnapshot.inProgressCount}
        subLabel={productionLoading ? 'Loading…' : productionLineLabel}
        hasAlert={productionAlert}
        variant="accent"
      />
    </div>
  );
};

export default FactoriesModuleKpiStrip;
