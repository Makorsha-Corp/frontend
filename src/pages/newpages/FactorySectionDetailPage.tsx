import React, { useState } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useParams, Link } from 'react-router-dom';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGetFactoryByIdQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionByIdQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery, useDeleteMachineMutation } from '@/features/machines/machinesApi';
import type { Machine } from '@/types/machine';
import { Layers, Pencil, Loader2, Plus, Search, Cog, Play, Pause, ClipboardList, Wrench } from 'lucide-react';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import AddMachineDialog from '@/components/newcomponents/customui/AddMachineDialog';
import EditMachineDialog from '@/components/newcomponents/customui/EditMachineDialog';
import MachineDetailCard from '@/components/newcomponents/customui/MachineDetailCard';
import { MachineListCardWithLatest } from '@/components/newcomponents/customui/MachineListCard';
import {
  brandIconGlyphClass,
  brandIconTileClass,
  neutralMetricIconClass,
  neutralMetricTileClass,
  statusMetricIconClass,
  statusMetricTileClass,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const FactorySectionDetailPage: React.FC = () => {
  const { id, sectionId } = useParams<{ id: string; sectionId: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [isEditMachineOpen, setIsEditMachineOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);

  const factoryId = id ? parseInt(id, 10) : null;
  const sectionIdNum = sectionId ? parseInt(sectionId, 10) : null;

  const { data: factory, isLoading: isLoadingFactory } = useGetFactoryByIdQuery(factoryId!, {
    skip: !factoryId || isNaN(factoryId),
  });
  const { data: section, isLoading: isLoadingSection, error } = useGetFactorySectionByIdQuery(sectionIdNum!, {
    skip: !sectionIdNum || isNaN(sectionIdNum),
  });
  const { data: sections = [] } = useGetFactorySectionsQuery(
    { factory_id: factoryId!, limit: 500 },
    { skip: !factoryId || isNaN(factoryId) }
  );
  const { data: machines, isLoading: machinesLoading, error: machinesError } = useGetMachinesQuery(
    {
      skip: 0,
      limit: 100,
      factory_section_id: sectionIdNum!,
      search: searchQuery || undefined,
    },
    { skip: !sectionIdNum || isNaN(sectionIdNum) }
  );

  const [deleteMachine, { isLoading: isDeletingMachine }] = useDeleteMachineMutation();

  const selectedMachine = machines?.find((m) => m.id === selectedMachineId) ?? null;

  const maintenanceDueCount = React.useMemo(() => {
    if (!machines) return 0;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return machines.filter((m) => {
      const d = m.next_maintenance_schedule ? new Date(m.next_maintenance_schedule) : null;
      return d && d <= in7Days;
    }).length;
  }, [machines]);

  const handleDeleteMachine = async (machine: Machine) => {
    if (!window.confirm(`Deactivate "${machine.name}"? This will soft-delete the machine.`)) return;
    try {
      await deleteMachine(machine.id).unwrap();
      toast.success('Machine deactivated');
      if (selectedMachineId === machine.id) setSelectedMachineId(null);
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Failed to deactivate machine');
    }
  };

  if (!factoryId || isNaN(factoryId) || !sectionIdNum || isNaN(sectionIdNum)) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 min-w-0 items-center justify-center">
          <p className="text-destructive">
            Invalid URL. <Link to="/factories" className="underline">Back to factories</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardNavbar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
        {/* Header */}
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/factories">Factories</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/factories/${factoryId}`}>{factory ? `${factory.name} (${factory.abbreviation})` : 'Factory'}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{section ? section.name : 'Section'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex min-w-0 items-center gap-3">
                <div className={brandIconTileClass} aria-hidden>
                  <Layers className={brandIconGlyphClass} strokeWidth={2} />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  {section ? section.name : 'Section'}
                </h1>
              </div>
            </div>
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
              <div className="relative w-[min(200px,36vw)] min-w-[140px] shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${appShellHeaderControlClass} bg-background pl-9`}
                />
              </div>
              {section && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className={`${appShellHeaderControlClass} shrink-0 border-border`}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Section
                </Button>
              )}
              <Button
                onClick={() => setIsAddMachineOpen(true)}
                className={`${appShellHeaderControlClass} shrink-0 bg-brand-primary shadow-sm hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </div>
          </div>
        </AppShellHeader>

        {/* Content */}
        {isLoadingFactory || isLoadingSection ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error || !section ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="shadow-sm bg-card border-border p-8">
              <p className="text-destructive mb-4">Section not found.</p>
              <Button asChild variant="outline">
                <Link to={`/factories/${factoryId}`}>Back to Factory</Link>
              </Button>
            </Card>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-4 p-6 overflow-hidden">
            {/* Section summary card - spans full width above both panels */}
            <Card className="flex-shrink-0 border-border bg-card shadow-sm">
              <CardContent className="px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="flex min-w-0 max-w-full items-center gap-3 sm:max-w-[14rem]">
                    <div className={brandIconTileClass} aria-hidden>
                      <Layers className={brandIconGlyphClass} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section</p>
                      <p className="truncate text-sm font-semibold text-card-foreground">{section.name}</p>
                      {factory && (
                        <p className="truncate text-xs text-muted-foreground">{factory.name} · ID {section.id}</p>
                      )}
                    </div>
                  </div>
                  <div className="hidden h-9 w-px bg-border sm:block" />
                  <div className="flex items-center gap-3">
                    <div className={brandIconTileClass} aria-hidden>
                      <Cog className={brandIconGlyphClass} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total machines</p>
                      <p className="text-base font-semibold tabular-nums text-card-foreground">{machines?.length ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={statusMetricTileClass.running} aria-hidden>
                      <Play className={statusMetricIconClass.running} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Running</p>
                      <p className="text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {machines?.filter((m) => m.is_running).length ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={statusMetricTileClass.stopped} aria-hidden>
                      <Pause className={statusMetricIconClass.stopped} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Not running</p>
                      <p className="text-base font-semibold tabular-nums text-red-700 dark:text-red-400">
                        {machines ? machines.length - machines.filter((m) => m.is_running).length : 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        maintenanceDueCount > 0 ? statusMetricTileClass.maintenance : neutralMetricTileClass
                      )}
                      aria-hidden
                    >
                      <Wrench
                        className={
                          maintenanceDueCount > 0
                            ? statusMetricIconClass.maintenance
                            : neutralMetricIconClass
                        }
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Maint. due</p>
                      <p
                        className={
                          maintenanceDueCount > 0
                            ? 'text-base font-semibold tabular-nums text-amber-800 dark:text-amber-400'
                            : 'text-base font-semibold tabular-nums text-card-foreground'
                        }
                      >
                        {maintenanceDueCount}
                      </p>
                    </div>
                  </div>
                  <div className="hidden h-9 w-px bg-border lg:block" />
                  <div className="flex items-center gap-3">
                    <div className={neutralMetricTileClass} aria-hidden>
                      <ClipboardList className={neutralMetricIconClass} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Orders</p>
                      <p className="text-base font-semibold tabular-nums text-muted-foreground">—</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-panel layout: machines list + detail */}
            <div className="flex-1 min-h-0 min-w-0 flex gap-6 overflow-hidden">
            {/* Left: Machines list */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm bg-card border-border">
                <div className="flex-shrink-0 border-b border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    {machinesLoading
                      ? 'Loading...'
                      : `${machines?.length ?? 0} machine${(machines?.length ?? 0) === 1 ? '' : 's'}`}
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  {machinesError ? (
                    <div className="text-center py-16 text-destructive">
                      Failed to load machines. Please try again.
                    </div>
                  ) : !machines || machines.length === 0 ? (
                    <div className="text-center py-16">
                      <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No machines in this section. Add one to get started.
                      </p>
                      <Button
                        onClick={() => setIsAddMachineOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary-hover"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Machine
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                      {machines.map((m) => (
                        <MachineListCardWithLatest
                          key={m.id}
                          machine={m}
                          selected={selectedMachineId === m.id}
                          onSelect={() => setSelectedMachineId(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Machine detail */}
            <div className="flex-[0_0_35%] min-w-0 max-w-[48rem] min-h-0 flex flex-col overflow-hidden">
              <MachineDetailCard
                machine={selectedMachine}
                onMachineUpdated={() => {}}
                onEditRequest={() => setIsEditMachineOpen(true)}
                onDeactivateRequest={
                  selectedMachine ? () => handleDeleteMachine(selectedMachine) : undefined
                }
                isDeactivating={isDeletingMachine}
                className="flex-1"
              />
            </div>
            </div>
          </div>
        )}
      </div>

      <EditFactorySectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        section={section ?? null}
        sections={sections}
      />

      <AddMachineDialog
        open={isAddMachineOpen}
        onOpenChange={setIsAddMachineOpen}
        factoryId={factoryId}
        sectionId={sectionIdNum}
        onSuccess={() => {}}
      />

      <EditMachineDialog
        open={isEditMachineOpen}
        onOpenChange={setIsEditMachineOpen}
        machine={selectedMachine}
        onSuccess={() => setIsEditMachineOpen(false)}
      />
    </div>
  );
};

export default FactorySectionDetailPage;
