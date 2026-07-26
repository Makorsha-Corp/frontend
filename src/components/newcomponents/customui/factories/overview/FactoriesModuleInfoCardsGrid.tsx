import React from 'react';
import FactoriesUnifiedMachineCard from '@/components/newcomponents/customui/factories/overview/FactoriesUnifiedMachineCard';
import FactoriesStorageInfoCard from '@/components/newcomponents/customui/factories/overview/FactoriesStorageInfoCard';
import FactoriesProductionInfoCard from '@/components/newcomponents/customui/factories/overview/FactoriesProductionInfoCard';
import type { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';
import type {
  MachineStatusCounts,
  ProductionCardSnapshot,
  StorageCardSnapshot,
} from '@/pages/newpages/factories/factoriesOverviewData';

interface FactoriesModuleInfoCardsGridProps {
  factoryFilter: string;
  scopeLabel: string;
  machineStatus: MachineStatusCounts;
  overdueCount: number;
  upcomingCount: number;
  overdueRows: DueStatusRow[];
  upcomingRows: DueStatusRow[];
  storageSnapshot: StorageCardSnapshot;
  productionSnapshot: ProductionCardSnapshot;
  machinesLoading?: boolean;
  storageLoading?: boolean;
  productionLoading?: boolean;
  onMaintenanceClick: () => void;
}

const FactoriesModuleInfoCardsGrid: React.FC<FactoriesModuleInfoCardsGridProps> = ({
  factoryFilter,
  scopeLabel,
  machineStatus,
  overdueCount,
  upcomingCount,
  overdueRows,
  upcomingRows,
  storageSnapshot,
  productionSnapshot,
  machinesLoading,
  storageLoading,
  productionLoading,
  onMaintenanceClick,
}) => (
  <div className="grid h-full min-h-0 grid-cols-1 items-stretch gap-4 md:grid-cols-3">
    <FactoriesUnifiedMachineCard
      scopeLabel={scopeLabel}
      factoryFilter={factoryFilter}
      machineStatus={machineStatus}
      overdueCount={overdueCount}
      upcomingCount={upcomingCount}
      overdueRows={overdueRows}
      upcomingRows={upcomingRows}
      machinesLoading={machinesLoading}
      onMaintenanceClick={onMaintenanceClick}
    />
    <FactoriesStorageInfoCard
      scopeLabel={scopeLabel}
      factoryFilter={factoryFilter}
      snapshot={storageSnapshot}
      loading={storageLoading}
    />
    <FactoriesProductionInfoCard
      scopeLabel={scopeLabel}
      factoryFilter={factoryFilter}
      snapshot={productionSnapshot}
      loading={productionLoading}
    />
  </div>
);

export default FactoriesModuleInfoCardsGrid;
