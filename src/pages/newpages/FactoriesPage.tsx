import React, { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetFactoriesQuery, useDeleteFactoryMutation } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import type { Factory } from '@/types/factory';
import { Search, Plus, Loader2, Pencil, Trash2, Factory as FactoryIcon, ChevronRight, Layers, Users } from 'lucide-react';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import DepartmentsManageDialog from '@/components/newcomponents/customui/DepartmentsManageDialog';
import FactoryDetailCard from '@/components/newcomponents/customui/FactoryDetailCard';
import { brandIconGlyphClass, brandIconTileClass } from '@/lib/machineVisualStatus';
import toast, { Toaster } from 'react-hot-toast';
import DueStatusCard, { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';

interface FactoryCardProps {
  factory: Factory;
  sectionsCount?: number;
  isSelected?: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const FactoryCard: React.FC<FactoryCardProps> = ({
  factory,
  sectionsCount = 0,
  isSelected = false,
  onEdit,
  onView,
  onDelete,
  isDeleting,
}) => (
    <Card
      className={`transition-all cursor-pointer group h-full flex flex-col ${
        isSelected
          ? 'border-brand-primary/40 bg-brand-primary/[0.06] ring-1 ring-brand-primary/25 shadow-sm'
          : 'border-border hover:border-brand-primary/30 hover:shadow-md'
      }`}
      onClick={onView}
    >
      <CardHeader className="space-y-0 p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className={brandIconTileClass} aria-hidden>
              <FactoryIcon className={brandIconGlyphClass} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base font-semibold leading-snug text-card-foreground">
                {factory.name}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                  {factory.abbreviation}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">#{factory.id}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end space-y-3 p-4 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>
            {sectionsCount} {sectionsCount === 1 ? 'section' : 'sections'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            View details
          </Button>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit factory</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deactivate factory</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
);

const FactoriesPage: React.FC = () => {
  const selectedFactory = useAppSelector((state) => state.auth.factory);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [isDeptsDialogOpen, setIsDeptsDialogOpen] = useState(false);

  const { data: factories, isLoading, error } = useGetFactoriesQuery({
    skip: 0,
    limit: 100,
    search: searchQuery || undefined,
  });
  const { data: allSections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: 500 });
  const { data: departments = [] } = useGetDepartmentsQuery({ skip: 0, limit: 100 });
  const { data: machines = [], isLoading: machinesLoading } = useGetMachinesQuery({ skip: 0, limit: 1000 });
  const sectionsByFactory = React.useMemo(() => {
    const map: Record<number, number> = {};
    for (const s of allSections) {
      map[s.factory_id] = (map[s.factory_id] ?? 0) + 1;
    }
    return map;
  }, [allSections]);
  const [deleteFactory, { isLoading: isDeleting }] = useDeleteFactoryMutation();
  const factoryById = React.useMemo(
    () => new Map((factories ?? []).map((f) => [f.id, f])),
    [factories]
  );
  const sectionById = React.useMemo(
    () => new Map(allSections.map((s) => [s.id, s])),
    [allSections]
  );

  const filteredFactories = React.useMemo(() => {
    if (!factories) return [];
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.abbreviation.toLowerCase().includes(q)
    );
  }, [factories, searchQuery]);

  const totalSectionsCount = React.useMemo(
    () => Object.values(sectionsByFactory).reduce((sum, count) => sum + count, 0),
    [sectionsByFactory]
  );

  const avgSectionsPerFactory = React.useMemo(() => {
    if (!factories || factories.length === 0) return 0;
    return totalSectionsCount / factories.length;
  }, [factories, totalSectionsCount]);

  const activitySummary = React.useMemo(() => {
    if (!factories || factories.length === 0) {
      return { high: 0, medium: 0, low: 0 };
    }
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const factory of factories) {
      const count = sectionsByFactory[factory.id] ?? 0;
      if (count >= 3) high += 1;
      else if (count >= 1) medium += 1;
      else low += 1;
    }
    return { high, medium, low };
  }, [factories, sectionsByFactory]);

  const activityTotal = activitySummary.high + activitySummary.medium + activitySummary.low;
  const activityHighPct = activityTotal > 0 ? (activitySummary.high / activityTotal) * 100 : 0;
  const activityMediumPct = activityTotal > 0 ? (activitySummary.medium / activityTotal) * 100 : 0;
  const activityLowPct = activityTotal > 0 ? (activitySummary.low / activityTotal) * 100 : 0;

  const trendSeries = React.useMemo(() => {
    if (!factories || factories.length === 0) return { active: 0, dormant: 0 };
    const active = factories.filter((f) => (sectionsByFactory[f.id] ?? 0) > 0).length;
    return { active, dormant: factories.length - active };
  }, [factories, sectionsByFactory]);

  const overviewDueRows: DueStatusRow[] = React.useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return machines
      .filter((m) => {
        if (!m.next_maintenance_schedule) return false;
        const d = new Date(m.next_maintenance_schedule);
        return !Number.isNaN(d.getTime()) && d <= horizon;
      })
      .sort(
        (a, b) =>
          new Date(a.next_maintenance_schedule!).getTime() -
          new Date(b.next_maintenance_schedule!).getTime()
      )
      .slice(0, 5)
      .map((m) => {
        const section = sectionById.get(m.factory_section_id);
        const factory = section ? factoryById.get(section.factory_id) : undefined;
        const dateLabel = m.next_maintenance_schedule
          ? new Date(m.next_maintenance_schedule).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '—';
        return {
          id: m.id,
          name: m.name,
          dateLabel,
          contextLabel: `${factory?.abbreviation ?? 'Factory'} · ${section?.name ?? `Section ${m.factory_section_id}`}`,
          href: section ? `/factories/${section.factory_id}/sections/${section.id}` : '/factories',
        };
      });
  }, [machines, sectionById, factoryById]);

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
  };

  const handleView = (factory: Factory) => {
    setSelectedFactoryId(factory.id);
  };

  const handleCloseDetail = () => {
    setSelectedFactoryId(null);
  };

  const handleDelete = async (factory: Factory) => {
    if (!window.confirm(`Are you sure you want to deactivate "${factory.name}"? This is a soft delete.`)) {
      return;
    }

    try {
      await deleteFactory(factory.id).unwrap();
      toast.success(`Factory "${factory.name}" has been deactivated`);
    } catch (error: any) {
      console.error('Failed to deactivate factory:', error);
      toast.error(error?.data?.detail || 'Failed to deactivate factory');
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) setEditingFactory(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20">
                  <FactoryIcon className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="min-w-0 truncate text-2xl font-bold text-card-foreground dark:text-foreground">
                  Factories
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptsDialogOpen(true)}
                className="flex max-w-full shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-left shadow-sm transition-colors hover:border-brand-primary/40 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:focus-visible:ring-offset-[hsl(var(--nav-background))]"
                aria-label={`Manage departments, ${departments.length} total`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary/10">
                  <Users className="h-4 w-4 text-brand-primary" />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="block text-xs font-semibold text-foreground">Departments</span>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {departments.length} {departments.length === 1 ? 'dept' : 'depts'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </div>
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-3">
              <div className="relative w-[min(200px,40vw)] min-w-[140px] shrink-0">
                <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search factories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-10"
                />
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="shrink-0 bg-brand-primary shadow-sm hover:bg-brand-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Factory
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-background">
          <Card className="mb-5 border-border bg-card shadow-sm">
            <CardContent className="px-6 py-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg border border-brand-primary/20 bg-brand-primary/[0.06] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary">Workspace factories</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">{factories?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total sections</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">{totalSectionsCount}</p>
                </div>
                <div className="rounded-lg border border-sky-500/25 bg-sky-500/[0.07] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Visible now</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">{filteredFactories.length}</p>
                </div>
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Avg sections / factory</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">
                    {avgSectionsPerFactory.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">High activity</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-3xl font-semibold tabular-nums text-card-foreground">{activitySummary.high}</p>
                    <Badge className="bg-violet-500/15 text-violet-700 hover:bg-violet-500/20 dark:text-violet-300">
                      {activitySummary.medium} medium
                    </Badge>
                    <Badge variant="outline" className="border-violet-400/35 text-violet-700 dark:text-violet-300">
                      {activitySummary.low} low
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                      {trendSeries.active} active
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                      {trendSeries.dormant} dormant
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700/80 dark:text-violet-300/80">
                      Activity mix
                    </p>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${activityHighPct}%`, float: 'left' }}
                        title={`High: ${activitySummary.high}`}
                      />
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${activityMediumPct}%`, float: 'left' }}
                        title={`Medium: ${activitySummary.medium}`}
                      />
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-600"
                        style={{ width: `${activityLowPct}%`, float: 'left' }}
                        title={`Low: ${activitySummary.low}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-5">
            <DueStatusCard
              title="Upcoming maintenance (overview)"
              loading={machinesLoading}
              rows={overviewDueRows}
              emptyMessage="No machines due within 7 days across factories."
            />
          </div>

          <Card className="shadow-sm bg-card border-border">
            <CardContent className="p-0">
              {/* Table/data header bar: count only (search lives in page header) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="shrink-0 text-sm text-muted-foreground">
                  {!isLoading && (
                    <span className="font-medium">
                      {filteredFactories.length}{' '}
                      {filteredFactories.length === 1 ? 'factory' : 'factories'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
                  <p className="text-muted-foreground">Loading factories...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-destructive">Failed to load factories. Please try again.</p>
                </div>
              ) : filteredFactories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary/10 rounded-full mb-4">
                    <FactoryIcon className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">No Factories Found</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    {searchQuery ? 'No factories match your search.' : 'Get started by adding your first factory.'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Factory
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:gap-5">
                  {filteredFactories.map((factory) => (
                    <FactoryCard
                      key={factory.id}
                      factory={factory}
                      sectionsCount={sectionsByFactory[factory.id] ?? 0}
                      isSelected={selectedFactory?.id === factory.id}
                      onEdit={() => handleEdit(factory)}
                      onView={() => handleView(factory)}
                      onDelete={() => handleDelete(factory)}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedFactoryId && (
        <FactoryDetailCard factoryId={selectedFactoryId} onClose={handleCloseDetail} />
      )}

      <AddFactoryDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} factories={factories ?? []} />
      <EditFactoryDialog
        open={!!editingFactory}
        onOpenChange={handleEditDialogClose}
        factory={editingFactory}
        factories={factories ?? []}
      />
      <DepartmentsManageDialog
        open={isDeptsDialogOpen}
        onOpenChange={setIsDeptsDialogOpen}
      />
    </div>
  );
};

export default FactoriesPage;
