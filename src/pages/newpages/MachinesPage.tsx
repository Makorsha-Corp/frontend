import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageFactoryScopeId } from '@/hooks/usePageFactoryScope';
import { sliceToFactoryFilter } from '@/lib/machinesLocationFilterAdapters';
import {
  machinesPageLocationToSlice,
  normalizeLocationSlice,
  resolveMachinesPageLocation,
  type MachinesLocationFilterSlice,
} from '@/lib/machinesLocationFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MachinesHubHeader from '@/components/newcomponents/customui/orders/MachinesHubHeader';
import WorkOrdersTabContent from '@/pages/newpages/orders/WorkOrdersTabContent';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery, useGetUpcomingMachineWorkQuery, useDeleteMachineMutation } from '@/features/machines/machinesApi';
import type { Machine } from '@/types/machine';
import { Layers, Loader2, Plus, Search, Cog, Play, Pause, Wrench, SlidersHorizontal } from 'lucide-react';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import AddMachineDialog from '@/components/newcomponents/customui/AddMachineDialog';
import EditMachineDialog from '@/components/newcomponents/customui/EditMachineDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import MachineDetailCard from '@/components/newcomponents/customui/MachineDetailCard';
import MachinesFiltersDialog, { type MachinesFiltersValue } from '@/components/newcomponents/customui/MachinesFiltersDialog';
import { MachineListCardWithLatest } from '@/components/newcomponents/customui/MachineListCard';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  brandIconGlyphClass,
  brandIconTileClass,
  machineKpiValueClass,
  neutralMetricIconClass,
  neutralMetricTileClass,
  statusMetricIconClass,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';
import { appToast } from '@/lib/appToast';
import { apiErrorDetail } from '@/utils/apiError';

const machineSectionHeaderClass = (atTop = false) =>
  cn(
    'flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b-2 border-border pb-2',
    atTop ? 'pt-3' : 'pt-4',
  );

interface MachineListToolbarControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
}

const MachineListToolbarControls: React.FC<MachineListToolbarControlsProps> = ({
  search,
  onSearchChange,
  onOpenFilters,
}) => (
  <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
    <div className="relative min-w-[140px] w-[min(200px,36vw)] shrink-0">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search machines..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(
          appShellHeaderControlClass,
          'border-border bg-background pl-9 focus-visible:ring-inset'
        )}
      />
    </div>
    <Button
      variant="outline"
      className={cn(
        appShellHeaderControlClass,
        'shrink-0 border-border bg-background focus-visible:ring-offset-0'
      )}
      onClick={onOpenFilters}
    >
      <SlidersHorizontal className="mr-2 h-4 w-4" />
      Filters
    </Button>
  </div>
);

interface MachineSectionHeaderRowProps {
  label: string;
  count?: number;
  formatCount?: (count: number) => string;
  showListToolbar?: boolean;
  atTop?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
}

const defaultFormatCount = (count: number) => `${count} machine${count === 1 ? '' : 's'}`;

const MachineSectionHeaderRow: React.FC<MachineSectionHeaderRowProps> = ({
  label,
  count,
  formatCount = defaultFormatCount,
  showListToolbar = false,
  atTop = false,
  search,
  onSearchChange,
  onOpenFilters,
}) => (
  <div className={machineSectionHeaderClass(atTop || showListToolbar)}>
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      <Layers className="h-5 w-5 shrink-0 text-brand-primary" />
      <p className="text-base font-semibold text-card-foreground">{label}</p>
      {count != null ? (
        <span className="text-xs text-muted-foreground/90 tabular-nums">{formatCount(count)}</span>
      ) : null}
    </div>
    {showListToolbar ? (
      <MachineListToolbarControls
        search={search}
        onSearchChange={onSearchChange}
        onOpenFilters={onOpenFilters}
      />
    ) : null}
  </div>
);

const machineKpiStripCellClass = 'flex min-h-[3.5rem] items-center gap-3';

const machineKpiFilterChipClass = (active: boolean) =>
  cn(
    'flex cursor-pointer items-center gap-3 rounded-lg border px-2.5 py-1.5 text-left shadow-sm transition-[background-color,border-color,box-shadow]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    active
      ? 'border-border bg-muted/55 shadow-md'
      : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/35 hover:shadow',
  );

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
    factory_ids: [],
    section_ids: [],
  };
};

const MachinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const factoryIdParam = searchParams.get('factoryId');
  const parsedFactorySeed = factoryIdParam ? parseInt(factoryIdParam, 10) : NaN;
  const { factoryId: pageFactoryId, setPageFactory } = usePageFactoryScopeId({
    initialOverride:
      Number.isFinite(parsedFactorySeed) ? String(parsedFactorySeed) : undefined,
  });

  const sectionIdParam = searchParams.get('sectionId');
  const machineIdParam = searchParams.get('machineId');
  const detailsParam = searchParams.get('details');

  useEffect(() => {
    if (!searchParams.has('factoryId')) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('factoryId');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const woMachineParam = searchParams.get('woMachine');
  const sheetMachineId = woMachineParam ? parseInt(woMachineParam, 10) : null;

  // Work orders live on machines — surfaced here as a tab rather than a separate page (for now).
  const activeTab = searchParams.get('tab') === 'workOrders' ? 'workOrders' : 'machines';
  const setActiveTab = (tab: 'machines' | 'workOrders') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'machines') next.delete('tab');
      else next.set('tab', tab);
      return next;
    });
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [isEditMachineOpen, setIsEditMachineOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const activeFilters = React.useMemo(
    () => parseMachineFiltersFromParams(searchParams),
    [searchParams]
  );
  const selectedMachineId = machineIdParam ? parseInt(machineIdParam, 10) : null;
  const sectionIdFromUrl = sectionIdParam ? parseInt(sectionIdParam, 10) : null;
  const validSectionIdFromUrl =
    sectionIdFromUrl != null && Number.isFinite(sectionIdFromUrl) ? sectionIdFromUrl : null;

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

  useEffect(() => {
    if (detailsParam !== '1' || !machineIdParam) return;
    const id = parseInt(machineIdParam, 10);
    if (!Number.isFinite(id)) return;
    handleSelectMachine(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('details');
      return next;
    }, { replace: true });
  }, [detailsParam, machineIdParam, handleSelectMachine, setSearchParams]);

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
    next.delete('filter_factory_ids');
    next.delete('filter_section_ids');
    return next;
  };

  const { data: allSections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: 1000 });

  const location = React.useMemo(
    () => resolveMachinesPageLocation(pageFactoryId, validSectionIdFromUrl, allSections),
    [pageFactoryId, validSectionIdFromUrl, allSections],
  );

  useEffect(() => {
    if (validSectionIdFromUrl == null || allSections.length === 0) return;
    const section = allSections.find((s) => s.id === validSectionIdFromUrl);
    if (!section) return;
    if (pageFactoryId !== section.factory_id) {
      setPageFactory(String(section.factory_id));
    }
  }, [validSectionIdFromUrl, allSections, pageFactoryId, setPageFactory]);

  const toolbarLocationValue = React.useMemo(
    () => machinesPageLocationToSlice(location),
    [location],
  );

  const handleToolbarLocationChange = useCallback(
    (slice: MachinesLocationFilterSlice) => {
      const normalized = normalizeLocationSlice(slice, allSections);
      setPageFactory(sliceToFactoryFilter(normalized));
      setSearchParams(
        (prev) => {
          const next = writeFiltersToParams(prev, activeFilters);
          next.delete('filter_factory_ids');
          next.delete('filter_section_ids');
          next.delete('factoryId');
          next.delete('machineId');
          if (normalized.section_ids.length === 1) {
            next.set('sectionId', String(normalized.section_ids[0]));
          } else {
            next.delete('sectionId');
          }
          return next;
        },
        { replace: true },
      );
    },
    [activeFilters, allSections, setPageFactory, setSearchParams],
  );

  const factory = React.useMemo(
    () => (location.factoryId != null ? factories.find((f) => f.id === location.factoryId) : undefined),
    [factories, location.factoryId],
  );

  const sections = React.useMemo(
    () =>
      location.factoryId != null
        ? allSections.filter((s) => s.factory_id === location.factoryId)
        : [],
    [allSections, location.factoryId],
  );

  const sectionForDialogs = React.useMemo(
    () =>
      location.sectionId != null
        ? allSections.find((s) => s.id === location.sectionId) ?? null
        : null,
    [allSections, location.sectionId],
  );

  const commitMachineFilters = (nextFilters: MachinesFiltersValue) => {
    setSearchParams((prev) => writeFiltersToParams(prev, nextFilters), { replace: true });
  };

  const clearFilters = () => {
    setPageFactory('all');
    setSearchParams(
      (prev) => {
        const next = writeFiltersToParams(prev, defaultMachineFilters);
        next.delete('sectionId');
        next.delete('filter_factory_ids');
        next.delete('filter_section_ids');
        next.delete('machineId');
        return next;
      },
      { replace: true },
    );
  };

  const { data: machines, isLoading: machinesLoading, error: machinesError } = useGetMachinesQuery(
    {
      skip: 0,
      limit: 1000,
      factory_id: location.factoryId ?? undefined,
      factory_section_id: location.sectionId ?? undefined,
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

  const { data: upcomingMachineWork = [] } = useGetUpcomingMachineWorkQuery({
    within_days: 7,
    factory_id: location.factoryId ?? undefined,
  });

  const upcomingMachineWorkFiltered = React.useMemo(() => {
    if (location.sectionId == null) return upcomingMachineWork;
    return upcomingMachineWork.filter((row) => row.factory_section_id === location.sectionId);
  }, [upcomingMachineWork, location.sectionId]);

  const [deleteMachine, { isLoading: isDeletingMachine }] = useDeleteMachineMutation();

  const effectiveFilteredMachines = machines ?? [];

  const machinesGroupedBySection = React.useMemo(() => {
    if (!factory || location.sectionId != null) return [];
    const grouped = new Map<number | 'unassigned', Machine[]>();
    for (const machine of effectiveFilteredMachines) {
      const key = machine.factory_section_id ?? 'unassigned';
      const current = grouped.get(key) ?? [];
      current.push(machine);
      grouped.set(key, current);
    }
    const groups = sections
      .map((s) => ({
        key: s.id as number | 'unassigned',
        label: s.name,
        machines: (grouped.get(s.id) ?? []).sort((a, b) => a.id - b.id),
      }))
      .filter((g) => g.machines.length > 0);
    const unassignedMachines = (grouped.get('unassigned') ?? []).sort((a, b) => a.id - b.id);
    if (unassignedMachines.length > 0) {
      groups.push({ key: 'unassigned', label: 'Unassigned', machines: unassignedMachines });
    }
    return groups;
  }, [factory, location.sectionId, effectiveFilteredMachines, sections]);

  const machinesGroupedByFactorySection = React.useMemo(() => {
    if (factory || location.sectionId != null) return [];
    const sectionById = new Map(allSections.map((s) => [s.id, s]));
    const factoryById = new Map(factories.map((f) => [f.id, f]));

    const factoryMap = new Map<number, { bySection: Map<number, Machine[]>; unassigned: Machine[] }>();
    for (const machine of effectiveFilteredMachines) {
      const entry =
        factoryMap.get(machine.factory_id) ?? { bySection: new Map<number, Machine[]>(), unassigned: [] };
      if (machine.factory_section_id != null) {
        const list = entry.bySection.get(machine.factory_section_id) ?? [];
        list.push(machine);
        entry.bySection.set(machine.factory_section_id, list);
      } else {
        entry.unassigned.push(machine);
      }
      factoryMap.set(machine.factory_id, entry);
    }

    return Array.from(factoryMap.entries())
      .map(([factoryIdKey, entry]) => {
        const factoryData = factoryById.get(factoryIdKey);
        const sectionsData = Array.from(entry.bySection.entries())
          .map(([sectionKey, machinesInSection]) => ({
            key: sectionKey as number | 'unassigned',
            label: sectionById.get(sectionKey)?.name ?? 'Unknown section',
            machines: machinesInSection.sort((a, b) => a.id - b.id),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (entry.unassigned.length > 0) {
          sectionsData.push({
            key: 'unassigned',
            label: 'Unassigned',
            machines: entry.unassigned.sort((a, b) => a.id - b.id),
          });
        }
        return { factory: factoryData, sections: sectionsData };
      })
      .filter((g) => g.factory && g.sections.length > 0)
      .sort((a, b) => (a.factory?.name ?? '').localeCompare(b.factory?.name ?? ''));
  }, [factory, location.sectionId, allSections, factories, effectiveFilteredMachines]);

  const selectedMachine = effectiveFilteredMachines.find((m) => m.id === selectedMachineId) ?? null;

  const upcomingMachineWorkCount = upcomingMachineWorkFiltered.length;

  const runningCount = effectiveFilteredMachines.filter((m) => m.is_running).length;
  const stoppedCount = effectiveFilteredMachines.length - runningCount;

  const kpiScopeFactoryName =
    location.factoryId != null
      ? factories.find((f) => f.id === location.factoryId)?.name ?? 'Factory'
      : null;
  const kpiScopeSectionName =
    location.sectionId != null
      ? allSections.find((s) => s.id === location.sectionId)?.name ?? 'Section'
      : null;

  const kpiContextLabel =
    location.sectionId != null
      ? kpiScopeSectionName ?? 'Section'
      : location.factoryId != null
        ? kpiScopeFactoryName ?? 'Factory'
        : 'All factories';

  const handleSearchChange = (value: string) => {
    commitMachineFilters({ ...activeFilters, search: value });
  };

  const toggleRunningKpiFilter = () => {
    commitMachineFilters({
      ...activeFilters,
      running_status: activeFilters.running_status === 'running' ? 'all' : 'running',
      maintenance_window: 'all',
    });
  };

  const toggleNotRunningKpiFilter = () => {
    commitMachineFilters({
      ...activeFilters,
      running_status: activeFilters.running_status === 'not_running' ? 'all' : 'not_running',
      maintenance_window: 'all',
    });
  };

  const toggleUpcomingWorkKpiFilter = () => {
    const enabling = activeFilters.maintenance_window !== 'next_7_days';
    commitMachineFilters({
      ...activeFilters,
      maintenance_window: enabling ? 'next_7_days' : 'all',
      running_status: enabling ? 'all' : activeFilters.running_status,
    });
  };

  const firstGroupedSectionKey = React.useMemo(() => {
    if (factory && location.sectionId == null && machinesGroupedBySection.length > 0) {
      return String(machinesGroupedBySection[0].key);
    }
    if (!factory && location.sectionId == null) {
      for (const group of machinesGroupedByFactorySection) {
        const first = group.sections[0];
        if (first) return `${group.factory!.id}-${String(first.key)}`;
      }
    }
    return null;
  }, [
    factory,
    location.sectionId,
    machinesGroupedBySection,
    machinesGroupedByFactorySection,
  ]);

  const handleDeleteMachine = async (machine: Machine) => {
    if (!window.confirm(`Deactivate "${machine.name}"? This will soft-delete the machine.`)) return;
    try {
      await deleteMachine(machine.id).unwrap();
      appToast.success('Machine deactivated');
      if (selectedMachineId === machine.id) handleSelectMachine(null);
    } catch (err) {
      appToast.error(apiErrorDetail(err, 'Failed to deactivate machine'));
    }
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
        {activeTab === 'workOrders' && (
          <WorkOrdersTabContent
            sheetMachineId={Number.isFinite(sheetMachineId) ? sheetMachineId : null}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === 'machines' && (
        <>
        <MachinesHubHeader
          sticky
          activeTab={activeTab}
          onTabChange={setActiveTab}
          factories={factories}
          sections={allSections}
          locationValue={toolbarLocationValue}
          onLocationChange={handleToolbarLocationChange}
          machinesActions={{ onAddMachine: () => setIsAddMachineOpen(true) }}
        />

        {/* Content */}
        {isLoadingFactories ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
            <p className="text-muted-foreground">Loading workspace machines...</p>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-hidden p-8">
            <Card className="shrink-0 border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <div
                    className={cn(
                      machineKpiStripCellClass,
                      'min-w-0 max-w-full sm:max-w-[14rem]',
                    )}
                  >
                    <div className={brandIconTileClass} aria-hidden>
                      <Cog className={brandIconGlyphClass} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Scope
                      </p>
                      {location.sectionId != null && kpiScopeFactoryName ? (
                        <>
                          <p className="truncate text-xs text-muted-foreground">{kpiScopeFactoryName}</p>
                          <p className="truncate text-base font-semibold text-card-foreground">
                            {kpiScopeSectionName}
                          </p>
                        </>
                      ) : (
                        <p className="truncate text-base font-semibold text-card-foreground">
                          {kpiContextLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="hidden h-9 w-px self-center bg-border sm:block" />
                  <div className={machineKpiStripCellClass}>
                    <div className={brandIconTileClass} aria-hidden>
                      <Cog className={brandIconGlyphClass} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total machines
                      </p>
                      <p className="text-base font-semibold tabular-nums text-card-foreground">
                        {machinesLoading ? '—' : effectiveFilteredMachines.length}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={machineKpiFilterChipClass(activeFilters.running_status === 'running')}
                    onClick={toggleRunningKpiFilter}
                    aria-pressed={activeFilters.running_status === 'running'}
                  >
                    <div className={neutralMetricTileClass} aria-hidden>
                      <Play className={statusMetricIconClass.running} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Running
                      </p>
                      <p
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          machineKpiValueClass.running
                        )}
                      >
                        {machinesLoading ? '—' : runningCount}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={machineKpiFilterChipClass(activeFilters.running_status === 'not_running')}
                    onClick={toggleNotRunningKpiFilter}
                    aria-pressed={activeFilters.running_status === 'not_running'}
                  >
                    <div className={neutralMetricTileClass} aria-hidden>
                      <Pause className={neutralMetricIconClass} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Not running
                      </p>
                      <p
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          'text-muted-foreground'
                        )}
                      >
                        {machinesLoading ? '—' : stoppedCount}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={machineKpiFilterChipClass(activeFilters.maintenance_window === 'next_7_days')}
                    onClick={toggleUpcomingWorkKpiFilter}
                    aria-pressed={activeFilters.maintenance_window === 'next_7_days'}
                  >
                    <div className={neutralMetricTileClass} aria-hidden>
                      <Wrench className={statusMetricIconClass.maintenance} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Upcoming work (7d)
                      </p>
                      <p
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          machineKpiValueClass.maintenance
                        )}
                      >
                        {machinesLoading ? '—' : upcomingMachineWorkCount}
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Two-panel layout: machines list + detail */}
            <div className="flex-1 min-h-0 min-w-0 flex gap-6 overflow-hidden">
            {/* Left: Machines list */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm bg-card border-border">
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                  {machinesError ? (
                    <div className="text-center py-16 text-destructive">
                      Failed to load machines. Please try again.
                    </div>
                  ) : effectiveFilteredMachines.length === 0 ? (
                    <div className="space-y-3">
                      <MachineSectionHeaderRow
                        label={kpiContextLabel}
                        showListToolbar
                        search={activeFilters.search}
                        onSearchChange={handleSearchChange}
                        onOpenFilters={() => setIsFiltersOpen(true)}
                      />
                      <div className="text-center py-16">
                        <Cog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No machines found.</p>
                        <Button
                          onClick={() => setIsAddMachineOpen(true)}
                          className="bg-brand-primary hover:bg-brand-primary-hover"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Machine
                        </Button>
                      </div>
                    </div>
                  ) : factory && location.sectionId == null ? (
                    <div className="space-y-5">
                      {machinesGroupedBySection.map(({ key, label, machines: secMachines }) => (
                        <div key={key} className="space-y-3">
                          <MachineSectionHeaderRow
                            label={label}
                            count={secMachines.length}
                            showListToolbar={String(key) === firstGroupedSectionKey}
                            search={activeFilters.search}
                            onSearchChange={handleSearchChange}
                            onOpenFilters={() => setIsFiltersOpen(true)}
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                            {secMachines.map((m) => (
                              <MachineListCardWithLatest
                                key={m.id}
                                machine={m}
                                selected={selectedMachineId === m.id}
                                onSelect={() => handleSelectMachine(m.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !factory && location.sectionId == null ? (
                    <div className="space-y-5">
                      {machinesGroupedByFactorySection.map((group) => (
                        <div key={group.factory!.id} className="space-y-4">
                          {group.sections.map((secGroup) => {
                            const sectionKey = `${group.factory!.id}-${String(secGroup.key)}`;
                            return (
                            <div key={secGroup.key} className="space-y-3">
                              <MachineSectionHeaderRow
                                label={secGroup.label}
                                count={secGroup.machines.length}
                                formatCount={(c) => String(c)}
                                showListToolbar={sectionKey === firstGroupedSectionKey}
                                search={activeFilters.search}
                                onSearchChange={handleSearchChange}
                                onOpenFilters={() => setIsFiltersOpen(true)}
                              />
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                                {secGroup.machines.map((m) => (
                                  <MachineListCardWithLatest
                                    key={m.id}
                                    machine={m}
                                    selected={selectedMachineId === m.id}
                                    onSelect={() => handleSelectMachine(m.id)}
                                  />
                                ))}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <MachineSectionHeaderRow
                        label={kpiContextLabel}
                        count={effectiveFilteredMachines.length}
                        showListToolbar
                        search={activeFilters.search}
                        onSearchChange={handleSearchChange}
                        onOpenFilters={() => setIsFiltersOpen(true)}
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                      {effectiveFilteredMachines.map((m) => (
                        <MachineListCardWithLatest
                          key={m.id}
                          machine={m}
                          selected={selectedMachineId === m.id}
                          onSelect={() => handleSelectMachine(m.id)}
                        />
                      ))}
                      </div>
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
        </>
        )}
      </div>

      <MachinesFiltersDialog
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        value={activeFilters}
        factories={factories}
        sections={allSections}
        showLocationFilters={false}
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
        section={sectionForDialogs}
        sections={sections}
      />

      <AddMachineDialog
        open={isAddMachineOpen}
        onOpenChange={setIsAddMachineOpen}
        factoryId={location.factoryId ?? undefined}
        sectionId={location.sectionId ?? undefined}
        onSuccess={() => {}}
      />

      <EditMachineDialog
        open={isEditMachineOpen}
        onOpenChange={setIsEditMachineOpen}
        machine={selectedMachine}
        onSuccess={() => setIsEditMachineOpen(false)}
      />
    </>
  );
};

export default MachinesPage;
