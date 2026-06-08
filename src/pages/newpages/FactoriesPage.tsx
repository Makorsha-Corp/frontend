import React, { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Plus, Loader2, Pencil, Trash2, Factory as FactoryIcon, ChevronRight, Layers, Users, Settings } from 'lucide-react';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import DepartmentsManageDialog from '@/components/newcomponents/customui/DepartmentsManageDialog';
import FactoryDetailCard from '@/components/newcomponents/customui/FactoryDetailCard';
import { brandIconGlyphClass, brandIconTileClass } from '@/lib/machineVisualStatus';
import toast, { Toaster } from 'react-hot-toast';
import DueStatusCard, { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';
import { cn } from '@/lib/utils';

/** Matches DashboardPage stat cards — brand theme colors */
type FactoryOverviewStatVariant =
  | 'primary'
  | 'primaryHover'
  | 'accent'
  | 'accentLight'
  | 'outlined';

const factoryOverviewStatStyles: Record<
  FactoryOverviewStatVariant,
  {
    card: string;
    title: string;
    value: string;
    icon: string;
    foot: string;
    badge: string;
    badgeMuted: string;
    sectionLabel: string;
  }
> = {
  primary: {
    card: 'bg-brand-primary text-white border-transparent shadow-sm',
    title: 'text-white/80',
    value: 'text-white',
    icon: 'text-white/60',
    foot: 'text-white/80',
    badge: 'border-white/30 bg-white/15 text-white hover:bg-white/15',
    badgeMuted: 'border-white/20 bg-white/10 text-white/90 hover:bg-white/10',
    sectionLabel: 'text-white/75',
  },
  primaryHover: {
    card: 'bg-brand-primary-hover text-white border-transparent shadow-sm',
    title: 'text-white/80',
    value: 'text-white',
    icon: 'text-white/60',
    foot: 'text-white/80',
    badge: 'border-white/30 bg-white/15 text-white hover:bg-white/15',
    badgeMuted: 'border-white/20 bg-white/10 text-white/90 hover:bg-white/10',
    sectionLabel: 'text-white/75',
  },
  accent: {
    card: 'bg-brand-accent text-card-foreground dark:text-accent-foreground border-transparent shadow-sm',
    title: 'text-card-foreground/60 dark:text-accent-foreground/70',
    value: 'text-card-foreground dark:text-accent-foreground',
    icon: 'text-card-foreground/60 dark:text-accent-foreground/60',
    foot: 'text-card-foreground/70 dark:text-accent-foreground/70',
    badge:
      'border-card-foreground/15 bg-background/60 text-card-foreground hover:bg-background/60 dark:border-accent-foreground/20 dark:bg-secondary/80 dark:text-foreground',
    badgeMuted:
      'border-card-foreground/10 bg-background/40 text-card-foreground/80 hover:bg-background/40 dark:border-accent-foreground/15 dark:bg-secondary/60 dark:text-foreground/80',
    sectionLabel: 'text-card-foreground/65 dark:text-accent-foreground/65',
  },
  accentLight: {
    card: 'bg-brand-accent-light text-card-foreground dark:text-accent-foreground border-transparent shadow-sm',
    title: 'text-card-foreground/60 dark:text-accent-foreground/70',
    value: 'text-card-foreground dark:text-accent-foreground',
    icon: 'text-card-foreground/60 dark:text-accent-foreground/60',
    foot: 'text-card-foreground/70 dark:text-accent-foreground/70',
    badge:
      'border-card-foreground/15 bg-background/50 text-card-foreground hover:bg-background/50 dark:border-accent-foreground/20 dark:bg-secondary/80 dark:text-foreground',
    badgeMuted:
      'border-card-foreground/10 bg-background/35 text-card-foreground/80 hover:bg-background/35 dark:border-accent-foreground/15 dark:bg-secondary/60 dark:text-foreground/80',
    sectionLabel: 'text-card-foreground/65 dark:text-accent-foreground/65',
  },
  outlined: {
    card: 'bg-card text-card-foreground border-2 border-brand-accent shadow-sm',
    title: 'text-card-foreground/60',
    value: 'text-card-foreground',
    icon: 'text-card-foreground/60',
    foot: 'text-muted-foreground',
    badge: 'border-brand-accent/40 bg-brand-accent/10 text-card-foreground hover:bg-brand-accent/10',
    badgeMuted: 'border-border bg-muted/50 text-muted-foreground hover:bg-muted/50',
    sectionLabel: 'text-card-foreground/60',
  },
};

interface FactoryOverviewStatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant: FactoryOverviewStatVariant;
  footer?: string;
  children?: React.ReactNode;
  interactive?: boolean;
  pinActionToBottom?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

const FactoryOverviewStatCard: React.FC<FactoryOverviewStatCardProps> = ({
  title,
  value,
  icon,
  variant,
  footer,
  children,
  interactive,
  pinActionToBottom,
  onClick,
  ariaLabel,
}) => {
  const s = factoryOverviewStatStyles[variant];
  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        s.card,
        'flex h-full min-h-0 flex-col',
        interactive &&
          'cursor-pointer transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className={cn('text-sm font-medium', s.title)}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn('min-h-0 flex-1 space-y-3', pinActionToBottom && 'pb-2')}>
        <div className="flex items-center justify-between gap-2">
          <div className={cn('text-3xl font-bold tabular-nums', s.value)}>{value}</div>
          <div className={cn('shrink-0', s.icon)}>{icon}</div>
        </div>
        {!pinActionToBottom ? children : null}
        {footer ? <p className={cn('text-xs', s.foot)}>{footer}</p> : null}
      </CardContent>
      {pinActionToBottom && children ? (
        <CardFooter className="mt-auto w-full shrink-0 flex-col items-stretch pb-6 pt-0">
          {children}
        </CardFooter>
      ) : null}
    </Card>
  );
};

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
  const visibleRatio = React.useMemo(() => {
    if (!factories || factories.length === 0) return 0;
    return (filteredFactories.length / factories.length) * 100;
  }, [factories, filteredFactories.length]);
  const sectionsForVisible = React.useMemo(
    () =>
      filteredFactories.reduce((sum, f) => {
        return sum + (sectionsByFactory[f.id] ?? 0);
      }, 0),
    [filteredFactories, sectionsByFactory]
  );
  const visibleFactoryCount = filteredFactories.length;
  const avgSectionsVisible = visibleFactoryCount > 0 ? sectionsForVisible / visibleFactoryCount : 0;
  const avgSectionsVsBaseline = avgSectionsPerFactory - 2;

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
        <AppShellHeader sticky>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={appShellHeaderIconTileClass}>
                <FactoryIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Factories</h1>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Factory
            </Button>
          </div>
        </AppShellHeader>

        {/* Content */}
        <div className="p-8 bg-background">
          <div className="mb-8 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-5">
            <FactoryOverviewStatCard
              variant="primary"
              title="Workspace factories"
              value={factories?.length ?? 0}
              icon={<FactoryIcon size={24} />}
              footer={
                selectedFactory
                  ? `Current navbar scope: ${selectedFactory.name}`
                  : 'Global scope (all factories)'
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={factoryOverviewStatStyles.primary.badge}>
                  {filteredFactories.length} visible
                </Badge>
                <Badge variant="outline" className={factoryOverviewStatStyles.primary.badgeMuted}>
                  {visibleRatio.toFixed(0)}% in view
                </Badge>
              </div>
            </FactoryOverviewStatCard>

            <FactoryOverviewStatCard
              variant="primaryHover"
              title="Total sections"
              value={totalSectionsCount}
              icon={<Layers size={24} />}
              footer={`Across ${visibleFactoryCount} visible ${visibleFactoryCount === 1 ? 'factory' : 'factories'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={factoryOverviewStatStyles.primaryHover.badge}>
                  {sectionsForVisible} in filtered view
                </Badge>
                <Badge variant="outline" className={factoryOverviewStatStyles.primaryHover.badgeMuted}>
                  {avgSectionsVisible.toFixed(1)} avg visible
                </Badge>
              </div>
            </FactoryOverviewStatCard>

            <FactoryOverviewStatCard
              variant="accent"
              title="Departments"
              value={departments.length}
              icon={<Users size={24} />}
              interactive
              pinActionToBottom
              onClick={() => setIsDeptsDialogOpen(true)}
              ariaLabel={`Manage departments, ${departments.length} total`}
            >
              <div
                className={cn(
                  appShellHeaderControlClass,
                  'flex w-full items-center justify-center rounded-md border border-card-foreground/25',
                  'bg-background/75 text-sm font-medium text-card-foreground shadow-sm'
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </div>
            </FactoryOverviewStatCard>

            <FactoryOverviewStatCard
              variant="accentLight"
              title="Avg sections / factory"
              value={avgSectionsPerFactory.toFixed(1)}
              icon={<ChevronRight size={24} />}
              footer="Baseline target is 2.0 sections per factory"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={factoryOverviewStatStyles.accentLight.badge}>
                  {totalSectionsCount} / {factories?.length ?? 0}
                </Badge>
                <Badge variant="outline" className={factoryOverviewStatStyles.accentLight.badgeMuted}>
                  {avgSectionsVsBaseline >= 0 ? '+' : ''}
                  {avgSectionsVsBaseline.toFixed(1)} vs baseline
                </Badge>
              </div>
            </FactoryOverviewStatCard>

            <FactoryOverviewStatCard
              variant="outlined"
              title="High activity"
              value={
                <span className="flex flex-wrap items-center gap-2">
                  <span>{activitySummary.high}</span>
                  <Badge variant="outline" className={factoryOverviewStatStyles.outlined.badge}>
                    {activitySummary.medium} medium
                  </Badge>
                  <Badge variant="outline" className={factoryOverviewStatStyles.outlined.badgeMuted}>
                    {activitySummary.low} low
                  </Badge>
                </span>
              }
              icon={<Layers size={24} />}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={factoryOverviewStatStyles.outlined.badge}>
                  {trendSeries.active} active
                </Badge>
                <Badge variant="outline" className={factoryOverviewStatStyles.outlined.badgeMuted}>
                  {trendSeries.dormant} dormant
                </Badge>
              </div>
              <div>
                <p
                  className={cn(
                    'mb-1 text-[11px] font-semibold uppercase tracking-wider',
                    factoryOverviewStatStyles.outlined.sectionLabel
                  )}
                >
                  Activity mix
                </p>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full bg-brand-primary"
                    style={{ width: `${activityHighPct}%`, float: 'left' }}
                    title={`High: ${activitySummary.high}`}
                  />
                  <div
                    className="h-full bg-brand-primary-hover"
                    style={{ width: `${activityMediumPct}%`, float: 'left' }}
                    title={`Medium: ${activitySummary.medium}`}
                  />
                  <div
                    className="h-full bg-brand-accent"
                    style={{ width: `${activityLowPct}%`, float: 'left' }}
                    title={`Low: ${activitySummary.low}`}
                  />
                </div>
              </div>
            </FactoryOverviewStatCard>
          </div>

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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {!isLoading && (
                    <span className="font-medium">
                      {filteredFactories.length}{' '}
                      {filteredFactories.length === 1 ? 'factory' : 'factories'}
                    </span>
                  )}
                </div>
                <div className="relative w-[min(220px,40vw)] min-w-[160px] shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search factories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 bg-background pl-9"
                  />
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
