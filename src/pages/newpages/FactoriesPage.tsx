import React, { useState } from 'react';
import { LayoutDashboard, Loader2, Plus, Users } from 'lucide-react';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import FactoriesOverviewDashboard from '@/components/newcomponents/customui/factories/overview/FactoriesOverviewDashboard';
import FactoriesShrunkGrid from '@/components/newcomponents/customui/factories/overview/FactoriesShrunkGrid';
import FactoriesFactoryDetailPanel from '@/components/newcomponents/customui/factories/overview/FactoriesFactoryDetailPanel';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import DepartmentsManageDialog from '@/components/newcomponents/customui/DepartmentsManageDialog';
import UpcomingMaintenanceDialog from '@/components/newcomponents/customui/UpcomingMaintenanceDialog';
import { Button } from '@/components/ui/button';
import { useDeleteFactoryMutation } from '@/features/factories/factoriesApi';
import {
  factoryFilterToSlice,
  sliceToFactoryFilter,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import type { Factory } from '@/types/factory';
import { useFactoriesOverviewPage } from '@/pages/newpages/factories/useFactoriesOverviewPage';
import toast from 'react-hot-toast';

const FactoriesPage: React.FC = () => {
  const overview = useFactoriesOverviewPage();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [isDeptsDialogOpen, setIsDeptsDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  const [deleteFactory, { isLoading: isDeleting }] = useDeleteFactoryMutation();

  const factoryLocationValue = factoryFilterToSlice(overview.factoryFilter);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    overview.setFactoryFilter(sliceToFactoryFilter({ factory_ids: slice.factory_ids }));
  };

  const handleDelete = async (factory: Factory) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate "${factory.name}"? This is a soft delete.`
      )
    ) {
      return;
    }
    try {
      await deleteFactory(factory.id).unwrap();
      toast.success(`Factory "${factory.name}" has been deactivated`);
      if (overview.activeFactory?.id === factory.id) {
        overview.clearFactorySelection();
      }
    } catch (error: unknown) {
      const detail =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { detail?: string } }).data?.detail
          : undefined;
      toast.error(detail || 'Failed to deactivate factory');
    }
  };

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className={`${appShellHeaderLeftGroupClass} min-w-0 flex-1`}>
              <div className={appShellHeaderIconTileClass}>
                <LayoutDashboard className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Factories Overview</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                variant="toolbar"
                value={factoryLocationValue}
                onChange={handleFactoryLocationChange}
                factories={overview.factories}
                sections={[]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={appShellHeaderControlClass}
                onClick={() => setIsDeptsDialogOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Departments
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Factory
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
          {overview.loadError ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-destructive">Failed to load factory overview. Please try again.</p>
            </div>
          ) : overview.isLoading && overview.factories.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-primary" />
              <p className="text-muted-foreground">Loading overview…</p>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-rows-[38fr_62fr] gap-0 overflow-hidden">
              <div className="flex h-full min-h-0 flex-col overflow-hidden pb-4">
                <FactoriesOverviewDashboard
                    data={{
                      factoryFilter: overview.factoryFilter,
                      storageSnapshot: overview.storageSnapshot,
                      productionSnapshot: overview.productionSnapshot,
                      scopeLabel: overview.scopeLabel,
                      machineStatus: overview.machineStatus,
                      overdueRows: overview.overdueRows,
                      upcomingRows: overview.upcomingRows,
                      overdueCount: overview.overdueCount,
                      upcomingCount: overview.upcomingCount,
                      loadMaintenanceDue: overview.loadMaintenanceDue,
                      loadInventory: overview.loadInventory,
                      loadBatches: overview.loadBatches,
                    }}
                    onMaintenanceClick={() => setIsMaintenanceDialogOpen(true)}
                  />
              </div>

              <div className="min-h-0 overflow-hidden pt-2">
                {overview.bottomPanelMode === 'grid' ? (
                  <FactoriesShrunkGrid
                    factories={overview.allFactoriesForManage}
                    factoryCardSnapshots={overview.factoryCardSnapshots}
                    searchQuery={overview.searchQuery}
                    onSearchChange={overview.setSearchQuery}
                    onSelect={overview.selectFactory}
                    onEdit={setEditingFactory}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                    isLoading={overview.isLoading}
                  />
                ) : overview.activeFactory ? (
                  <FactoriesFactoryDetailPanel
                    factory={overview.activeFactory}
                    machines={overview.machines}
                    sections={overview.allSections}
                    attention={overview.factoryAttention}
                    activity={overview.factoryActivity}
                    attentionLoading={overview.loadMachines}
                    activityLoading={overview.loadFactoryActivity || overview.loadMachines}
                    onBack={overview.clearFactorySelection}
                    onEditFactory={() => setEditingFactory(overview.activeFactory)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Factory not found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddFactoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        factories={overview.factories}
      />
      <EditFactoryDialog
        open={!!editingFactory}
        onOpenChange={(open) => {
          if (!open) setEditingFactory(null);
        }}
        factory={editingFactory}
        factories={overview.factories}
      />
      <DepartmentsManageDialog open={isDeptsDialogOpen} onOpenChange={setIsDeptsDialogOpen} />
      <UpcomingMaintenanceDialog
        open={isMaintenanceDialogOpen}
        onOpenChange={setIsMaintenanceDialogOpen}
        loading={overview.loadMaintenanceDue}
        overdueRows={overview.overdueRows}
        upcomingRows={overview.upcomingRows}
        description={`Overdue and upcoming machine work for ${overview.scopeLabel}.`}
        emptyMessage={`No overdue or upcoming machine work for ${overview.scopeLabel}.`}
      />
    </>
  );
};

export default FactoriesPage;
