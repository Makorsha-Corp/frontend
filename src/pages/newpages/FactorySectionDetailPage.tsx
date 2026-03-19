import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Layers, Pencil, Loader2, Plus, Search, Trash2, Cog, Play, Pause, ClipboardList, Wrench } from 'lucide-react';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import AddMachineDialog from '@/components/newcomponents/customui/AddMachineDialog';
import EditMachineDialog from '@/components/newcomponents/customui/EditMachineDialog';
import MachineDetailCard from '@/components/newcomponents/customui/MachineDetailCard';
import toast, { Toaster } from 'react-hot-toast';

const FactorySectionDetailPage: React.FC = () => {
  const { id, sectionId } = useParams<{ id: string; sectionId: string }>();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
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

  const [deleteMachine] = useDeleteMachineMutation();

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

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachineId(machine.id);
    setIsEditMachineOpen(true);
  };

  if (!factoryId || isNaN(factoryId) || !sectionIdNum || isNaN(sectionIdNum)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">
          Invalid URL. <Link to="/factories" className="underline">Back to factories</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <div className="flex-shrink-0 bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
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
              <div className="h-6 w-px bg-border" />
              <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground">
                {section ? section.name : 'Section'}
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {section && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="border-border h-9"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Section
                </Button>
              )}
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>
              <Button
                onClick={() => setIsAddMachineOpen(true)}
                className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm h-9"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </div>
          </div>
        </div>

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
            <Card className="flex-shrink-0 shadow-sm bg-card border-border">
              <CardContent className="py-4 px-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Section</p>
                      <p className="text-sm font-semibold text-card-foreground">{section.name}</p>
                      {factory && (
                        <p className="text-xs text-muted-foreground">{factory.name} (ID {section.id})</p>
                      )}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Cog className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Total Machines</p>
                      <p className="text-sm font-semibold text-card-foreground">{machines?.length ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Running</p>
                      <p className="text-sm font-semibold text-card-foreground">
                        {machines?.filter((m) => m.is_running).length ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Pause className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Stopped</p>
                      <p className="text-sm font-semibold text-card-foreground">
                        {machines ? machines.length - machines.filter((m) => m.is_running).length : 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${maintenanceDueCount > 0 ? 'bg-amber-500/10' : 'bg-muted'}`}>
                      <Wrench className={`h-4 w-4 ${maintenanceDueCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Maintenance Due</p>
                      <p className="text-sm font-semibold text-card-foreground">{maintenanceDueCount}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Running Orders</p>
                      <p className="text-sm font-semibold text-card-foreground">—</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-panel layout: machines list + detail */}
            <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
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
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b border-border">
                            <TableHead className="w-[60px] py-3 text-xs font-semibold text-muted-foreground uppercase">ID</TableHead>
                            <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase">Name</TableHead>
                            <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                            <TableHead className="text-right w-[120px] py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {machines.map((m) => (
                            <TableRow
                              key={m.id}
                              className={`cursor-pointer hover:bg-brand-primary/10 border-b border-border last:border-0 ${
                                selectedMachineId === m.id ? 'bg-brand-primary/10' : ''
                              }`}
                              onClick={() => setSelectedMachineId(m.id)}
                            >
                              <td className="font-mono text-sm text-muted-foreground py-3 px-4">{m.id}</td>
                              <td className="font-medium text-card-foreground py-3">{m.name}</td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    m.is_running ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {m.is_running ? 'Running' : 'Stopped'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                                    onClick={() => handleEditMachine(m)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteMachine(m)}
                                    title="Deactivate"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Machine detail */}
            <div className="w-[400px] shrink-0 min-h-0 flex flex-col overflow-hidden">
              <MachineDetailCard
                machine={selectedMachine}
                onMachineUpdated={() => {}}
                onEditRequest={() => setIsEditMachineOpen(true)}
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
