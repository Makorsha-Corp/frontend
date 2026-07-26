import React from 'react';
import FactoriesModuleInfoCardsGrid from '@/components/newcomponents/customui/factories/overview/FactoriesModuleInfoCardsGrid';
import type { UseFactoriesOverviewPageReturn } from '@/pages/newpages/factories/useFactoriesOverviewPage';

interface FactoriesOverviewDashboardProps {
  data: Pick<
    UseFactoriesOverviewPageReturn,
    | 'factoryFilter'
    | 'storageSnapshot'
    | 'productionSnapshot'
    | 'scopeLabel'
    | 'machineStatus'
    | 'overdueRows'
    | 'upcomingRows'
    | 'overdueCount'
    | 'upcomingCount'
    | 'loadMaintenanceDue'
    | 'loadInventory'
    | 'loadBatches'
  >;
  onMaintenanceClick: () => void;
}

const FactoriesOverviewDashboard: React.FC<FactoriesOverviewDashboardProps> = ({
  data,
  onMaintenanceClick,
}) => (
  <FactoriesModuleInfoCardsGrid
    factoryFilter={data.factoryFilter}
    scopeLabel={data.scopeLabel}
    machineStatus={data.machineStatus}
    overdueCount={data.overdueCount}
    upcomingCount={data.upcomingCount}
    overdueRows={data.overdueRows}
    upcomingRows={data.upcomingRows}
    storageSnapshot={data.storageSnapshot}
    productionSnapshot={data.productionSnapshot}
    machinesLoading={data.loadMaintenanceDue}
    storageLoading={data.loadInventory}
    productionLoading={data.loadBatches}
    onMaintenanceClick={onMaintenanceClick}
  />
);

export default FactoriesOverviewDashboard;
