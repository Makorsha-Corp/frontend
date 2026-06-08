import React, { useState, useEffect, useCallback } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGetFactoriesQuery, useGetFactoryByIdQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionByIdQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery, useDeleteMachineMutation } from '@/features/machines/machinesApi';
import { clearFactory, setFactory } from '@/features/auth/authSlice';
import type { Machine } from '@/types/machine';
import { Layers, Pencil, Loader2, Plus, Search, Cog, Play, Pause, ClipboardList, Wrench, SlidersHorizontal } from 'lucide-react';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import AddMachineDialog from '@/components/newcomponents/customui/AddMachineDialog';
import EditMachineDialog from '@/components/newcomponents/customui/EditMachineDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import MachineDetailCard, {
  type MachineFullDetailsIntent,
} from '@/components/newcomponents/customui/MachineDetailCard';
import MachinesFiltersDialog, { type MachinesFiltersValue } from '@/components/newcomponents/customui/MachinesFiltersDialog';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import { MachineListCardWithLatest } from '@/components/newcomponents/customui/MachineListCard';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
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

const defaultMachineFilters: MachinesFiltersValue = {
  search: '',
  running_status: 'all',
  maintenance_window: 'all',
  has_model_number: 'all',
  has_manufacturer: 'all',
  latest_event_type: 'all',
  sort_by: 'name',
  sort_dir: 'asc',
  factory_ids: [],
  section_ids: [],
};

const parseMachineFiltersFromParams = (params: URLSearchParams): MachinesFiltersValue => {
  const running_status = params.get('running_status');
  const maintenance_window = params.get('maintenance_window');
  const has_model_number = params.get('has_model_number');
  const has_manufacturer = params.get('has_manufacturer');
  const latest_event_type = params.get('latest_event_type');
  const sort_by = params.get('sort_by');
  const sort_dir = params.get('sort_dir');
  const search = params.get('search') ?? '';
  const factory_ids = (params.get('filter_factory_ids') ?? '')
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n));
  const section_ids = (params.get('filter_section_ids') ?? '')
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n));

  // Legacy scope params (factoryId/sectionId) — used by deep links and factory drill-down.
  const resolvedFactoryIds =
    factory_ids.length > 0
      ? factory_ids
      : (() => {
          const factoryId = params.get('factoryId');
          if (!factoryId) return [];
          const id = parseInt(factoryId, 10);
          return Number.isFinite(id) ? [id] : [];
        })();

  const resolvedSectionIds =
    section_ids.length > 0
      ? section_ids
      : (() => {
          const sectionId = params.get('sectionId');
          if (!sectionId) return [];
          const id = parseInt(sectionId, 10);
          return Number.isFinite(id) ? [id] : [];
        })();

  return {
    search,
    running_status: running_status === 'running' || running_status === 'not_running' ? running_status : 'all',
    maintenance_window:
      maintenance_window === 'overdue' ||
      maintenance_window === 'next_7_days' ||
      maintenance_window === 'next_30_days' ||
      maintenance_window === 'none_scheduled'
        ? maintenance_window
        : 'all',
    has_model_number: has_model_number === 'yes' || has_model_number === 'no' ? has_model_number : 'all',
    has_manufacturer: has_manufacturer === 'yes' || has_manufacturer === 'no' ? has_manufacturer : 'all',
    latest_event_type:
      latest_event_type === 'IDLE' ||
      latest_event_type === 'RUNNING' ||
      latest_event_type === 'OFF' ||
      latest_event_type === 'MAINTENANCE'
        ? latest_event_type
        : 'all',
    sort_by: sort_by === 'created_at' || sort_by === 'maintenance_date' ? sort_by : 'name',
    sort_dir: sort_dir === 'desc' ? 'desc' : 'asc',
    factory_ids: resolvedFactoryIds,
    section_ids: resolvedSectionIds,
  };
};

const MachinesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGlobalFactory = useAppSelector((state) => state.auth.factory);
  const navigate = useNavigate();
  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const factoryIdParam = searchParams.get('factoryId');
  const sectionIdParam = searchParams.get('sectionId');
  const machineIdParam = searchParams.get('machineId');
  const selectedFactoryId = factoryIdParam ? parseInt(factoryIdParam, 10) : selectedGlobalFactory?.id ?? null;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [isEditMachineOpen, setIsEditMachineOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [fullDetailsIntent, setFullDetailsIntent] = useState<MachineFullDetailsIntent | null>(null);
  const activeFilters = React.useMemo(
    () => parseMachineFiltersFromParams(searchParams),
    [searchParams]
  );
  
  const selectedMachineId = machineIdParam ? parseInt(machineIdParam, 10) : null;
  const sectionIdNum = sectionIdParam ? parseInt(sectionIdParam, 10) : null;

  const handleSelectMachine = useCallback((id: number | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) {
        next.set('machineId', id.toString());
      } else {
        next.delete('machineId');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFullDetailsIntent = useCallback(() => setFullDetailsIntent(null), []);

  const openMachineFullDetails = useCallback(
    (id: number) => {
      handleSelectMachine(id);
      setFullDetailsIntent({ id });
    },
    [handleSelectMachine]
  );

  const writeFiltersToParams = (
    prev: URLSearchParams,
    filters: MachinesFiltersValue
  ): URLSearchParams => {
    const next = new URLSearchParams(prev);
    const setOrDelete = (key: string, value: string, defaultValue: string) => {
      if (!value || value === defaultValue) next.delete(key);
      else next.set(key, value);
    };
    setOrDelete('search', filters.search.trim(), defaultMachineFilters.search);
    setOrDelete('running_status', filters.running_status, defaultMachineFilters.running_status);
    setOrDelete('maintenance_window', filters.maintenance_window, defaultMachineFilters.maintenance_window);
    setOrDelete('has_model_number', filters.has_model_number, defaultMachineFilters.has_model_number);
    setOrDelete('has_manufacturer', filters.has_manufacturer, defaultMachineFilters.has_manufacturer);
    setOrDelete('latest_event_type', filters.latest_event_type, defaultMachineFilters.latest_event_type);
    setOrDelete('sort_by', filters.sort_by, defaultMachineFilters.sort_by);
    setOrDelete('sort_dir', filters.sort_dir, defaultMachineFilters.sort_dir);
    if (filters.factory_ids.length > 0) next.set('filter_factory_ids', filters.factory_ids.join(','));
    else next.delete('filter_factory_ids');
    if (filters.section_ids.length > 0) next.set('filter_section_ids', filters.section_ids.join(','));
    else next.delete('filter_section_ids');
    return next;
  };

  // Deep links (factoryId/sectionId in URL) scope this page only — never touch global factory.
  // Without URL scope, default the machines URL to the navbar factory selection.
  useEffect(() => {
    if (factoryIdParam) return;

    if (selectedGlobalFactory?.id) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('factoryId', String(selectedGlobalFactory.id));
        next.delete('sectionId');
        next.delete('machineId');
        return next;
      }, { replace: true });
    }
  }, [factoryIdParam, selectedGlobalFactory?.id, setSearchParams]);

  const { data: section, isLoading: isLoadingSection } = useGetFactorySectionByIdQuery(sectionIdNum!, {
    skip: !sectionIdNum || isNaN(sectionIdNum),
  });

  const factoryId = section?.factory_id ?? selectedFactoryId ?? undefined;

  const { data: factory } = useGetFactoryByIdQuery(factoryId!, {
    skip: !factoryId,
  });

  const { data: sections = [] } = useGetFactorySectionsQuery(
    { factory_id: factoryId!, limit: 500 },
    { skip: !factoryId }
  );
  const { data: allSections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: 1000 });

  const allFactoryIdsList = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const commitMachineFilters = (nextFilters: MachinesFiltersValue) => {
    const prevFilters = parseMachineFiltersFromParams(searchParams);
    const locationChanged =
      prevFilters.factory_ids.join(',') !== nextFilters.factory_ids.join(',') ||
      prevFilters.section_ids.join(',') !== nextFilters.section_ids.join(',');

    const effF =
      nextFilters.factory_ids.length === 0 ? allFactoryIdsList : nextFilters.factory_ids;
    const fset = new Set(effF);
    const allS = allSections.filter((s) => fset.has(s.factory_id)).map((s) => s.id);
    const effS =
      nextFilters.section_ids.length === 0
        ? allS
        : nextFilters.section_ids.filter((id) => allS.includes(id));

    if (locationChanged) {
      if (effF.length === 1) {
        const f = factories.find((x) => x.id === effF[0]);
        if (f) dispatch(setFactory(f));
      } else {
        dispatch(clearFactory());
      }
    }

    setSearchParams((prev) => {
      const next = writeFiltersToParams(prev, nextFilters);
      if (locationChanged) {
        if (effF.length === 1) next.set('factoryId', String(effF[0]));
        else next.delete('factoryId');
        if (effS.length === 1) next.set('sectionId', String(effS[0]));
        else next.delete('sectionId');
        next.delete('machineId');
      }
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    commitMachineFilters(defaultMachineFilters);
  };

  const { data: machines, isLoading: machinesLoading, error: machinesError } = useGetMachinesQuery(
    {
      skip: 0,
      limit: 1000,
      factory_section_id: sectionIdNum || undefined,
      search: activeFilters.search || undefined,
      is_running:
        activeFilters.running_status === 'all'
          ? undefined
          : activeFilters.running_status === 'running',
      maintenance_window:
        activeFilters.maintenance_window === 'all' ? undefined : activeFilters.maintenance_window,
      has_model_number:
        activeFilters.has_model_number === 'all'
          ? undefined
          : activeFilters.has_model_number === 'yes',
      has_manufacturer:
        activeFilters.has_manufacturer === 'all'
          ? undefined
          : activeFilters.has_manufacturer === 'yes',
      latest_event_type:
        activeFilters.latest_event_type === 'all' ? undefined : activeFilters.latest_event_type,
      sort_by: activeFilters.sort_by,
      sort_dir: activeFilters.sort_dir,
    }
  );

  const [deleteMachine, { isLoading: isDeletingMachine }] = useDeleteMachineMutation();

  const factorySectionIds = React.useMemo(() => new Set(sections.map((s) => s.id)), [sections]);

  const filteredMachines = React.useMemo(() => {
    if (!machines) return [];
    if (sectionIdNum) return machines;
    if (!selectedFactoryId) return machines;
    return machines.filter((m) => factorySectionIds.has(m.factory_section_id));
  }, [machines, sectionIdNum, selectedFactoryId, factorySectionIds]);

  const allSectionsById = React.useMemo(
    () => new Map(allSections.map((s) => [s.id, s])),
    [allSections]
  );

  const effectiveFilteredMachines = React.useMemo(() => {
    let list = filteredMachines;
    if (activeFilters.factory_ids.length > 0) {
      const allowedFactoryIds = new Set(activeFilters.factory_ids);
      list = list.filter((m) => {
        const sec = allSectionsById.get(m.factory_section_id);
        return !!sec && allowedFactoryIds.has(sec.factory_id);
      });
    }
    if (activeFilters.section_ids.length > 0) {
      const allowedSectionIds = new Set(activeFilters.section_ids);
      list = list.filter((m) => allowedSectionIds.has(m.factory_section_id));
    }
    return list;
  }, [filteredMachines, activeFilters.factory_ids, activeFilters.section_ids, allSectionsById]);

  const machinesGroupedBySection = React.useMemo(() => {
    if (!factory || sectionIdNum) return [];
    const grouped = new Map<number, Machine[]>();
    for (const machine of effectiveFilteredMachines) {
      const current = grouped.get(machine.factory_section_id) ?? [];
      current.push(machine);
      grouped.set(machine.factory_section_id, current);
    }
    return sections
      .map((s) => ({
        section: s,
        machines: (grouped.get(s.id) ?? []).sort((a, b) => a.id - b.id),
      }))
      .filter((g) => g.machines.length > 0);
  }, [factory, sectionIdNum, effectiveFilteredMachines, sections]);

  const machinesGroupedByFactorySection = React.useMemo(() => {
    if (factory || sectionIdNum) return [];
    const sectionById = new Map(allSections.map((s) => [s.id, s]));
    const factoryById = new Map(factories.map((f) => [f.id, f]));

    const factoryMap = new Map<number, Map<number, Machine[]>>();
    for (const machine of effectiveFilteredMachines) {
      const sec = sectionById.get(machine.factory_section_id);
      if (!sec) continue;
      const sectionMap = factoryMap.get(sec.factory_id) ?? new Map<number, Machine[]>();
      const list = sectionMap.get(sec.id) ?? [];
      list.push(machine);
      sectionMap.set(sec.id, list);
      factoryMap.set(sec.factory_id, sectionMap);
    }

    return Array.from(factoryMap.entries())
      .map(([factoryIdKey, sectionMap]) => {
        const factoryData = factoryById.get(factoryIdKey);
        const sectionsData = Array.from(sectionMap.entries())
          .map(([sectionKey, machinesInSection]) => ({
            section: sectionById.get(sectionKey),
            machines: machinesInSection.sort((a, b) => a.id - b.id),
          }))
          .filter((g) => g.section)
          .sort((a, b) => (a.section?.name ?? '').localeCompare(b.section?.name ?? ''));
        return { factory: factoryData, sections: sectionsData };
      })
      .filter((g) => g.factory && g.sections.length > 0)
      .sort((a, b) => (a.factory?.name ?? '').localeCompare(b.factory?.name ?? ''));
  }, [factory, sectionIdNum, allSections, factories, effectiveFilteredMachines]);

  const selectedMachine = effectiveFilteredMachines.find((m) => m.id === selectedMachineId) ?? null;

  const maintenanceDueCount = React.useMemo(() => {
    if (!effectiveFilteredMachines) return 0;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return effectiveFilteredMachines.filter((m) => {
      const d = m.next_maintenance_schedule ? new Date(m.next_maintenance_schedule) : null;
      return d && d <= in7Days;
    }).length;
  }, [effectiveFilteredMachines]);

  const handleDeleteMachine = async (machine: Machine) => {
    if (!window.confirm(`Deactivate "${machine.name}"? This will soft-delete the machine.`)) return;
    try {
      await deleteMachine(machine.id).unwrap();
      toast.success('Machine deactivated');
      if (selectedMachineId === machine.id) handleSelectMachine(null);
    } catch (err: any) {
      toast.error(err?.data?.detail || 'Failed to deactivate machine');
    }
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Cog className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before you can use the machines page. Set up a factory to start tracking your machines and their maintenance schedules.
          </p>
          <Button 
            size="lg" 
            className="bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            Create Your First Factory
          </Button>

          <AddFactoryDialog
            open={isAddFactoryOpen}
            onOpenChange={setIsAddFactoryOpen}
            factories={factories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardNavbar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className="flex min-w-0 items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35" aria-hidden>
                  <Cog className={brandIconGlyphClass} strokeWidth={2} />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  Machines
                </h1>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <Breadcrumb className="min-w-0 self-end">
                <BreadcrumbList className="items-end text-card-foreground dark:text-foreground">
                  <BreadcrumbItem className="max-w-[min(240px,45vw)] min-w-0">
                    <MachinesInlineLocationFilters
                      which="factories"
                      variant="breadcrumb"
                      baseline="lowered"
                      value={{
                        factory_ids: activeFilters.factory_ids,
                        section_ids: activeFilters.section_ids,
                      }}
                      onChange={(slice) =>
                        commitMachineFilters({ ...activeFilters, ...slice })
                      }
                      factories={factories}
                      sections={allSections}
                    />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="-translate-y-[3px]" />
                  <BreadcrumbItem className="max-w-[min(240px,45vw)] min-w-0">
                    <MachinesInlineLocationFilters
                      which="sections"
                      variant="breadcrumb"
                      baseline="lowered"
                      value={{
                        factory_ids: activeFilters.factory_ids,
                        section_ids: activeFilters.section_ids,
                      }}
                      onChange={(slice) =>
                        commitMachineFilters({ ...activeFilters, ...slice })
                      }
                      factories={factories}
                      sections={allSections}
                    />
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <div className="relative w-[min(200px,36vw)] min-w-[140px] shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search machines..."
                  value={activeFilters.search}
                  onChange={(e) =>
                    commitMachineFilters({
                      ...activeFilters,
                      search: e.target.value,
                    })
                  }
                  className={`${appShellHeaderControlClass} bg-background pl-9 focus-visible:ring-inset`}
                />
              </div>
              <Button
                variant="outline"
                className={`${appShellHeaderControlClass} shrink-0 focus-visible:ring-offset-0`}
                onClick={() => setIsFiltersOpen(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
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
        {isLoadingSection ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
            <p className="text-muted-foreground">Loading workspace machines...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-4 p-6 overflow-hidden">
            {/* Summary card - flexes based on global vs section */}
            <Card className="flex-shrink-0 border-border bg-card shadow-sm">
              <CardContent className="px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  {section ? (
                    <div className="flex min-w-0 max-w-full items-center gap-3 sm:max-w-[14rem]">
                      <div className={brandIconTileClass} aria-hidden>
                        <Layers className={brandIconGlyphClass} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filtered Section</p>
                        <p className="truncate text-sm font-semibold text-card-foreground">{section.name}</p>
                        {factory && (
                          <p className="truncate text-xs text-muted-foreground">{factory.name} · ID {section.id}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 max-w-full items-center gap-3 sm:max-w-[14rem]">
                      <div className={brandIconTileClass} aria-hidden>
                        <Cog className={brandIconGlyphClass} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Global View</p>
                        <p className="truncate text-sm font-semibold text-card-foreground">All Workspace Machines</p>
                      </div>
                    </div>
                  )}
                  <div className="hidden h-9 w-px bg-border sm:block" />
                  <div className="flex items-center gap-3">
                    <div className={brandIconTileClass} aria-hidden>
                      <Cog className={brandIconGlyphClass} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total machines</p>
                      <p className="text-base font-semibold tabular-nums text-card-foreground">{effectiveFilteredMachines.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={statusMetricTileClass.running} aria-hidden>
                      <Play className={statusMetricIconClass.running} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Running</p>
                      <p className="text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {effectiveFilteredMachines.filter((m) => m.is_running).length}
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
                        {effectiveFilteredMachines.length - effectiveFilteredMachines.filter((m) => m.is_running).length}
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
            <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
            {/* Left: Machines list */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm bg-card border-border">
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  {machinesError ? (
                    <div className="text-center py-16 text-destructive">
                      Failed to load machines. Please try again.
                    </div>
                  ) : effectiveFilteredMachines.length === 0 ? (
                    <div className="text-center py-16">
                      <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No machines found.
                      </p>
                      <Button
                        onClick={() => setIsAddMachineOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary-hover"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Machine
                      </Button>
                    </div>
                  ) : factory && !sectionIdNum ? (
                    <div className="space-y-5">
                      {machinesGroupedBySection.map(({ section: sec, machines: secMachines }) => (
                        <div key={sec.id} className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                            <Layers className="h-4 w-4 text-brand-primary" />
                            <p className="text-sm font-medium text-foreground/90">{sec.name}</p>
                            <span className="text-xs text-muted-foreground/90 tabular-nums">
                              {secMachines.length} machine{secMachines.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-5">
                            {secMachines.map((m) => (
                              <MachineListCardWithLatest
                                key={m.id}
                                machine={m}
                                selected={selectedMachineId === m.id}
                                onSelect={() => handleSelectMachine(m.id)}
                                onExpandDetails={() => openMachineFullDetails(m.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !factory && !sectionIdNum ? (
                    <div className="space-y-6">
                      {machinesGroupedByFactorySection.map((group) => (
                        <div key={group.factory!.id} className="space-y-5">
                          {group.sections.map((secGroup) => (
                            <div key={secGroup.section!.id} className="space-y-2">
                              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                                <Layers className="h-3.5 w-3.5 text-brand-primary/70" />
                                <p className="text-sm font-medium text-foreground/90">
                                  {group.factory!.name} ({group.factory!.abbreviation}) - {secGroup.section!.name}
                                </p>
                                <span className="text-xs text-muted-foreground/80 tabular-nums">
                                  {secGroup.machines.length}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-5">
                                {secGroup.machines.map((m) => (
                                  <MachineListCardWithLatest
                                    key={m.id}
                                    machine={m}
                                    selected={selectedMachineId === m.id}
                                    onSelect={() => handleSelectMachine(m.id)}
                                    onExpandDetails={() => openMachineFullDetails(m.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-5">
                      {effectiveFilteredMachines.map((m) => (
                        <MachineListCardWithLatest
                          key={m.id}
                          machine={m}
                          selected={selectedMachineId === m.id}
                          onSelect={() => handleSelectMachine(m.id)}
                          onExpandDetails={() => openMachineFullDetails(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Machine detail */}
            <div className="w-[400px] shrink-0 min-h-0 flex flex-col overflow-hidden">
              <MachineDetailCard
                machine={selectedMachine}
                fullDetailsIntent={fullDetailsIntent}
                onFullDetailsIntentConsumed={clearFullDetailsIntent}
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

      <MachinesFiltersDialog
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        value={activeFilters}
        factories={factories}
        sections={allSections}
        onApply={(next) => {
          commitMachineFilters(next);
          setIsFiltersOpen(false);
        }}
        onClear={() => {
          clearFilters();
          setIsFiltersOpen(false);
        }}
      />

      <EditFactorySectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        section={section ?? null}
        sections={sections}
      />

      <AddMachineDialog
        open={isAddMachineOpen}
        onOpenChange={setIsAddMachineOpen}
        factoryId={factoryId || undefined}
        sectionId={sectionIdNum || undefined}
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

export default MachinesPage;
