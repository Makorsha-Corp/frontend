import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetFactoryByIdQuery, useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery, useDeleteFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import FactoryMachinesStatusPanel from '@/components/newcomponents/customui/FactoryMachinesStatusPanel';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Factory as FactoryIcon,
  Pencil,
  Loader2,
  Layers,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Cog,
  Hash,
} from 'lucide-react';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import AddFactorySectionDialog from '@/components/newcomponents/customui/AddFactorySectionDialog';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import type { FactorySection } from '@/types/factorySection';
import {
  brandIconGlyphClass,
  brandIconTileClass,
  neutralMetricIconClass,
  neutralMetricTileClass,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

interface FactorySectionCardProps {
  section: FactorySection;
  machineCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const FactorySectionCard: React.FC<FactorySectionCardProps> = ({
  section,
  machineCount,
  onOpen,
  onEdit,
  onDelete,
  isDeleting,
}) => (
  <Card
    className="group flex h-full cursor-pointer flex-col border-border transition-all hover:border-brand-primary/30 hover:shadow-md"
    onClick={onOpen}
  >
    <CardHeader className="space-y-0 p-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={brandIconTileClass} aria-hidden>
            <Layers className={brandIconGlyphClass} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base font-semibold leading-snug text-card-foreground">{section.name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="tabular-nums text-xs text-muted-foreground">#{section.id}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-primary" />
      </div>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col justify-end space-y-3 p-4 pt-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Cog className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {machineCount} {machineCount === 1 ? 'machine' : 'machines'}
        </span>
      </div>
      <div
        className="flex items-center justify-between border-t border-border pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Open section
        </Button>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit section</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deactivate section</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
);

const FactoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FactorySection | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');

  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteFactorySectionMutation();

  const factoryId = id ? parseInt(id, 10) : null;
  const { data: factory, isLoading, error } = useGetFactoryByIdQuery(factoryId!, {
    skip: !factoryId || isNaN(factoryId),
  });
  const { data: allFactories = [] } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const { data: sections = [] } = useGetFactorySectionsQuery(
    { factory_id: factoryId!, limit: 500 },
    { skip: !factoryId || isNaN(factoryId) }
  );

  const { data: workspaceMachines = [], isLoading: machinesLoading } = useGetMachinesQuery(
    { skip: 0, limit: 1000 },
    { skip: !factoryId || isNaN(factoryId) }
  );

  const sectionIdSet = React.useMemo(() => new Set(sections.map((s) => s.id)), [sections]);

  const factoryMachines = React.useMemo(
    () => workspaceMachines.filter((m) => sectionIdSet.has(m.factory_section_id)),
    [workspaceMachines, sectionIdSet]
  );

  const sectionNameById = React.useMemo(() => {
    const m = new Map<number, string>();
    sections.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [sections]);

  const machineCountBySectionId = React.useMemo(() => {
    const m = new Map<number, number>();
    factoryMachines.forEach((mach) => {
      m.set(mach.factory_section_id, (m.get(mach.factory_section_id) ?? 0) + 1);
    });
    return m;
  }, [factoryMachines]);

  const filteredSections = React.useMemo(() => {
    if (!sectionSearchQuery.trim()) return sections;
    const q = sectionSearchQuery.toLowerCase();
    return sections.filter((s) => s.name.toLowerCase().includes(q));
  }, [sections, sectionSearchQuery]);

  const handleEditSection = (section: FactorySection) => {
    setEditingSection(section);
    setIsEditSectionDialogOpen(true);
  };

  const handleEditSectionDialogClose = (open: boolean) => {
    if (!open) setEditingSection(null);
    setIsEditSectionDialogOpen(open);
  };

  const handleDeleteSection = async (section: FactorySection) => {
    if (!window.confirm(`Are you sure you want to deactivate "${section.name}"? This is a soft delete.`)) {
      return;
    }
    try {
      await deleteSection(section.id).unwrap();
      toast.success(`Section "${section.name}" has been deactivated`);
    } catch (error: any) {
      console.error('Failed to deactivate section:', error);
      toast.error(error?.data?.detail || 'Failed to deactivate section');
    }
  };

  if (!factoryId || isNaN(factoryId)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">Invalid factory ID. <a href="/factories" className="underline">Back to factories</a></p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-8 py-5 shadow-sm dark:bg-[hsl(var(--nav-background))]">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                    <BreadcrumbPage>
                      {factory ? `${factory.name} (${factory.abbreviation})` : 'Factory'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex min-w-0 items-center gap-3">
                <div className={brandIconTileClass} aria-hidden>
                  <FactoryIcon className={brandIconGlyphClass} strokeWidth={2} />
                </div>
                <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  {factory ? `${factory.name} (${factory.abbreviation})` : 'Factory'}
                </h1>
              </div>
            </div>
            {factory && (
              <div className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
                <div className="relative w-[min(200px,36vw)] min-w-[140px] shrink-0">
                  <Search
                    className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="text"
                    placeholder="Search sections..."
                    value={sectionSearchQuery}
                    onChange={(e) => setSectionSearchQuery(e.target.value)}
                    className="h-9 bg-background pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 border-border"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Factory
                </Button>
                <Button
                  size="sm"
                  className="h-9 shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
                  onClick={() => setIsAddSectionDialogOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
              <p className="text-muted-foreground">Loading factory...</p>
            </div>
          ) : error || !factory ? (
            <Card className="shadow-sm bg-card border-border">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-destructive mb-4">Factory not found.</p>
                  <Button onClick={() => navigate('/factories')} variant="outline">
                    Back to Factories
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
                <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm">
                  <CardHeader className="px-6 pb-2 pt-6 sm:px-7 sm:pt-7">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className={cn(brandIconTileClass, 'h-12 w-12 shrink-0 sm:h-14 sm:w-14')} aria-hidden>
                        <FactoryIcon className="h-6 w-6 text-brand-primary sm:h-7 sm:w-7" strokeWidth={2} />
                      </div>
                      <CardTitle className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-semibold leading-tight tracking-tight text-card-foreground sm:gap-x-3 sm:text-3xl">
                        <span className="min-w-0">{factory.name}</span>
                        <span className="shrink-0 rounded-lg border border-brand-primary/25 bg-brand-primary/10 px-2.5 py-0.5 text-sm font-semibold tracking-wide text-brand-primary sm:text-base">
                          {factory.abbreviation}
                        </span>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
                    <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-5 dark:border-border dark:bg-muted/10 sm:px-5 sm:py-6">
                      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:mb-5">
                        At a glance
                      </p>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3.5">
                          <div className={neutralMetricTileClass} aria-hidden>
                            <Layers className={neutralMetricIconClass} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-3xl font-semibold tabular-nums leading-none text-card-foreground sm:text-4xl">
                              {sections.length}
                            </p>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">
                              {sections.length === 1 ? 'Section' : 'Sections'}
                            </p>
                          </div>
                        </div>
                        <div className="flex min-w-0 items-start gap-3.5 sm:border-l sm:border-border/60 sm:pl-4">
                          <div className={neutralMetricTileClass} aria-hidden>
                            <Cog className={neutralMetricIconClass} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-3xl font-semibold tabular-nums leading-none text-card-foreground sm:text-4xl">
                              {factoryMachines.length}
                            </p>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">
                              {factoryMachines.length === 1 ? 'Machine' : 'Machines'}
                            </p>
                          </div>
                        </div>
                        <div className="flex min-w-0 items-start gap-3.5 sm:border-l sm:border-border/60 sm:pl-4">
                          <div className={neutralMetricTileClass} aria-hidden>
                            <Hash className={neutralMetricIconClass} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-3xl font-semibold tabular-nums leading-none text-card-foreground sm:text-4xl">
                              {factory.id}
                            </p>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Factory ID</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <FactoryMachinesStatusPanel
                  factoryId={factoryId}
                  machines={factoryMachines}
                  machinesLoading={machinesLoading}
                  sectionNameById={sectionNameById}
                />
              </div>

              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'}
                    </span>
                  </div>
                  <div className="p-4">
                    {filteredSections.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                        <Layers className="mb-3 h-10 w-10 opacity-50" />
                        <p>
                          {sectionSearchQuery
                            ? 'No sections match your search.'
                            : 'No sections yet. Add your first section.'}
                        </p>
                        {!sectionSearchQuery && (
                          <Button
                            size="sm"
                            className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
                            onClick={() => setIsAddSectionDialogOpen(true)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Section
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredSections.map((section) => (
                          <FactorySectionCard
                            key={section.id}
                            section={section}
                            machineCount={machineCountBySectionId.get(section.id) ?? 0}
                            onOpen={() => navigate(`/factories/${factoryId}/sections/${section.id}`)}
                            onEdit={() => handleEditSection(section)}
                            onDelete={() => handleDeleteSection(section)}
                            isDeleting={isDeletingSection}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <EditFactoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        factory={factory ?? null}
        factories={allFactories}
      />
      <AddFactorySectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
        factoryId={factoryId}
        sections={sections}
      />
      <EditFactorySectionDialog
        open={isEditSectionDialogOpen}
        onOpenChange={handleEditSectionDialogClose}
        section={editingSection}
        sections={sections}
      />
    </div>
  );
};

export default FactoryDetailPage;
