import React, { useState } from 'react';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetMachinesQuery, useDeleteMachineMutation } from '@/features/machines/machinesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useAppSelector } from '@/app/hooks';
import type { Machine } from '@/types/machine';
import { Search, Plus, Loader2, Pencil, Trash2, Cog } from 'lucide-react';
import AddMachineDialog from '@/components/newcomponents/customui/AddMachineDialog';
import EditMachineDialog from '@/components/newcomponents/customui/EditMachineDialog';
import MachineDetailCard from '@/components/newcomponents/customui/MachineDetailCard';
import toast, { Toaster } from 'react-hot-toast';

const MachinesPage: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const globalFactory = useAppSelector((state) => state.auth.factory);
  const [factoryId, setFactoryId] = useState<number | undefined>(globalFactory?.id);
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [deleteMachine] = useDeleteMachineMutation();

  const { data: factories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: sections } = useGetFactorySectionsQuery(
    { skip: 0, limit: 100, factory_id: factoryId },
    { skip: !factoryId }
  );

  const { data: machines, isLoading, error } = useGetMachinesQuery(
    {
      skip: 0,
      limit: 100,
      factory_section_id: sectionId,
      search: searchQuery || undefined,
    },
    { skip: !sectionId }
  );

  React.useEffect(() => {
    setFactoryId(globalFactory?.id);
  }, [globalFactory?.id]);

  React.useEffect(() => {
    if (factoryId !== globalFactory?.id) {
      setSectionId(undefined);
    }
  }, [factoryId, globalFactory?.id]);

  const selectedMachine =
    machines?.find((m) => m.id === selectedMachineId) ?? null;

  const handleDelete = async (machine: Machine) => {
    if (!window.confirm(`Deactivate "${machine.name}"? This will soft-delete the machine.`)) return;
    try {
      await deleteMachine(machine.id).unwrap();
      toast.success('Machine deactivated');
      if (selectedMachineId === machine.id) {
        setSelectedMachineId(null);
      }
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to deactivate machine');
    }
  };

  const handleEdit = (machine: Machine) => {
    setSelectedMachineId(machine.id);
    setIsEditOpen(true);
  };

  const handleAddClick = () => {
    if (sectionId) setIsAddOpen(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header: Factory & Section in header bar (consistent with Production, etc.) */}
        <div className="flex-shrink-0 bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Cog className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                Machines
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={factoryId?.toString() ?? '__none__'}
                onValueChange={(v) =>
                  setFactoryId(v === '__none__' ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select factory</SelectItem>
                  {(factories ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sectionId?.toString() ?? '__none__'}
                onValueChange={(v) =>
                  setSectionId(v === '__none__' ? undefined : parseInt(v))
                }
                disabled={!factoryId}
              >
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select section</SelectItem>
                  {(sections ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sectionId && (
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
              )}
              <Button
                onClick={handleAddClick}
                disabled={!sectionId}
                className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm h-9"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </div>
          </div>
        </div>

        {/* Content: two-panel layout - no page scroll, list and detail scroll within their areas */}
        <div className="flex-1 min-h-0 flex gap-6 p-6 overflow-hidden">
          {/* Left: Machines list - scrollable within card */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm bg-card border-border">
              <div className="flex-shrink-0 border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground font-medium">
                  {!sectionId
                    ? 'Select factory and section to list machines'
                    : isLoading
                      ? 'Loading...'
                      : `${machines?.length ?? 0} machine${(machines?.length ?? 0) === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {!sectionId ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    Select a factory and section to view machines
                  </div>
                ) : isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                  </div>
                ) : error ? (
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
                      onClick={handleAddClick}
                      disabled={!sectionId}
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
                          <TableHead className="w-[60px] py-3 text-xs font-semibold text-muted-foreground uppercase">
                            ID
                          </TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase">
                            Name
                          </TableHead>
                          <TableHead className="w-[100px] py-3 text-xs font-semibold text-muted-foreground uppercase">
                            Status
                          </TableHead>
                          <TableHead className="text-right w-[120px] py-3 text-xs font-semibold text-muted-foreground uppercase">
                            Actions
                          </TableHead>
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
                            <td className="font-mono text-sm text-muted-foreground py-3 px-4">
                              {m.id}
                            </td>
                            <td className="font-medium text-card-foreground py-3">
                              {m.name}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  m.is_running
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
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
                                  onClick={() => handleEdit(m)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(m)}
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

          {/* Right: Machine detail card - scrollable within card */}
          <div className="w-[400px] shrink-0 min-h-0 flex flex-col overflow-hidden">
            <MachineDetailCard
              machine={selectedMachine}
              onMachineUpdated={() => {}}
              onEditRequest={() => setIsEditOpen(true)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {sectionId && factoryId && (
        <AddMachineDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          factoryId={factoryId}
          sectionId={sectionId}
          onSuccess={() => {}}
        />
      )}

      <EditMachineDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        machine={selectedMachine}
        onSuccess={() => {
          setIsEditOpen(false);
        }}
      />
    </div>
  );
};

export default MachinesPage;
