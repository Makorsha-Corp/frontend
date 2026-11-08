import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { useGetMachinesQuery, useGetUpcomingMachineWorkQuery } from '@/features/machines/machinesApi';
import FactoryMachinesStatusPanel from '@/components/newcomponents/customui/FactoryMachinesStatusPanel';
import { splitUpcomingWorkByDueWindow } from '@/lib/machineUpcomingWork';
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
  ArrowLeft,
  Play,
  Pause,
  Wrench,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import AddFactorySectionDialog from '@/components/newcomponents/customui/AddFactorySectionDialog';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import { MachineListCardWithLatest } from '@/components/newcomponents/customui/MachineListCard';
import type { FactorySection } from '@/types/factorySection';
import {
  brandIconGlyphClass,
  brandIconTileClass,
  neutralMetricIconClass,
  neutralMetricTileClass,
} from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';
import { appToast } from '@/lib/appToast';
import { apiErrorDetail } from '@/utils/apiError';

export interface SectionMachineStats {
  total: number;
  running: number;
  notRunning: number;
  maintDue: number;
}

interface FactorySectionCardProps {
  section: FactorySection;
  factoryName: string;
  stats: SectionMachineStats;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const FactorySectionCard: React.FC<FactorySectionCardProps> = ({
  section,
  factoryName,
  stats,
  onOpen,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const { t } = useTranslation('factories');
  const { t: tMachines } = useTranslation('machines');
  return (
  <Card
    className="group flex h-full min-w-[380px] max-w-[460px] shrink-0 cursor-pointer flex-col border-border transition-all hover:border-brand-primary/30 hover:shadow-md snap-start relative overflow-hidden"
    onClick={onOpen}
  >
    <CardHeader className="space-y-0 p-5 pb-4 border-b border-border/50 bg-muted/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className={cn(brandIconTileClass, "mt-0.5")} aria-hidden>
            <Layers className={brandIconGlyphClass} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{t('sectionLabelOne')}</p>
            <CardTitle className="truncate text-base font-semibold leading-tight text-card-foreground">
              {section.name}
            </CardTitle>
            <p className="truncate text-xs text-muted-foreground mt-1">
              {t('sectionIdLine', { factory: factoryName, id: section.id })}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-primary" />
      </div>
    </CardHeader>
    
    <CardContent className="flex flex-col flex-1 p-5 gap-3">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 w-full">
        <div className="flex items-center gap-2">
          <Cog className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{t('metricTotal')}</span>
            <span className="text-sm font-semibold tabular-nums text-card-foreground leading-none">{stats.total}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{tMachines('running')}</span>
            <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 leading-none">
              {stats.running}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Pause className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={2} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{t('metricStopped')}</span>
            <span className="text-sm font-semibold tabular-nums text-red-700 dark:text-red-400 leading-none">
              {stats.notRunning}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Wrench className={cn("h-4 w-4", stats.maintDue > 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground")} strokeWidth={2} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{t('metricMaint')}</span>
            <span className={cn("text-sm font-semibold tabular-nums leading-none", stats.maintDue > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-card-foreground')}>
              {stats.maintDue}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 min-w-0 col-span-2 pt-2 border-t border-border/50">
          <ClipboardList className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{t('metricOrders')}</span>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground leading-none">—</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div
        className="flex items-center justify-end w-full mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
              <TooltipContent>{t('editSectionTooltip')}</TooltipContent>
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
              <TooltipContent>{t('deactivateSectionTooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardContent>
  </Card>
  );
};

interface FactoryDetailCardProps {
  factoryId: number;
  onClose: () => void;
}

const FactoryDetailCard: React.FC<FactoryDetailCardProps> = ({ factoryId, onClose }) => {
  const { t } = useTranslation('factories');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FactorySection | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);

  const handleHorizontalWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };

  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteFactorySectionMutation();

  const { data: factory, isLoading, error } = useGetFactoryByIdQuery(factoryId);
  const { data: allFactories = [] } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const { data: sections = [] } = useGetFactorySectionsQuery({ factory_id: factoryId, limit: 500 });
  const { data: workspaceMachines = [], isLoading: machinesLoading } = useGetMachinesQuery({ skip: 0, limit: 1000 });

  const factoryMachines = React.useMemo(
    () => workspaceMachines.filter((m) => m.factory_id === factoryId),
    [workspaceMachines, factoryId]
  );

  const { data: upcomingWork = [] } = useGetUpcomingMachineWorkQuery(
    {
      within_days: 7,
      factory_id: factoryId,
      include_overdue: true,
    },
    { skip: !factory }
  );

  const sectionById = React.useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections]
  );

  const maintenanceDueRows = React.useMemo(() => {
    if (!factory) return [];
    const split = splitUpcomingWorkByDueWindow(
      upcomingWork,
      sectionById,
      7,
      factory.abbreviation,
      {
        unassigned: t('attentionUnassigned'),
        sectionFallback: t('fallbackSection', { ns: 'machines' }),
        draft: t('workStatusDraft'),
        recurring: t('workStatusRecurring'),
        inProgress: t('workStatusInProgress'),
        workOrder: t('workStatusWorkOrder'),
      },
    );
    return [...split.overdueRows, ...split.upcomingRows];
  }, [factory, upcomingWork, sectionById, t]);

  const sectionStats = React.useMemo(() => {
    const statsMap = new Map<number, SectionMachineStats>();
    sections.forEach((s) => {
      statsMap.set(s.id, { total: 0, running: 0, notRunning: 0, maintDue: 0 });
    });

    factoryMachines.forEach((m) => {
      if (m.factory_section_id == null) return;
      const stats = statsMap.get(m.factory_section_id);
      if (stats) {
        stats.total++;
        if (m.is_running) stats.running++;
        else stats.notRunning++;
      }
    });

    for (const row of maintenanceDueRows) {
      if (row.machineId == null) continue;
      const machine = factoryMachines.find((m) => m.id === row.machineId);
      if (!machine?.factory_section_id) continue;
      const stats = statsMap.get(machine.factory_section_id);
      if (stats) stats.maintDue += 1;
    }

    return statsMap;
  }, [sections, factoryMachines, maintenanceDueRows]);

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
    if (!window.confirm(t('deactivateSectionConfirm', { name: section.name }))) {
      return;
    }
    try {
      await deleteSection(section.id).unwrap();
      appToast.success(t('deactivateSectionSuccess', { name: section.name }));
    } catch (error) {
      console.error('Failed to deactivate section:', error);
      appToast.error(apiErrorDetail(error, t('deactivateSectionFailed')));
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="min-h-[400px] flex flex-col items-center justify-center p-0">
          <DialogTitle className="sr-only">{t('detailLoadingTitle')}</DialogTitle>
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
          <p className="text-muted-foreground">{t('detailLoading')}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !factory) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="min-h-[400px] flex flex-col items-center justify-center p-0">
          <DialogTitle className="sr-only">{t('detailErrorTitle')}</DialogTitle>
          <p className="text-destructive mb-4">{t('factoryNotFound')}</p>
          <Button onClick={onClose} variant="outline">
            {tCommon('close')}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 overflow-hidden border-border bg-background max-h-[90vh] flex flex-col gap-0">
        <DialogTitle className="sr-only">{t('detailDialogTitle', { name: factory.name })}</DialogTitle>
        <DialogDescription className="sr-only">{t('detailDialogDescription', { name: factory.name })}</DialogDescription>
        
        {/* Scrollable Container inside Dialog */}
        <div className="flex-1 overflow-y-auto min-h-[60vh]">
          <div className="flex flex-col w-full relative bg-background">
            <div className="pointer-events-none flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/50 px-6 py-4 sticky top-0 z-10">
              <div className="pointer-events-auto flex items-center gap-4">
                <div className={cn(brandIconTileClass, 'h-10 w-10 shrink-0 hidden sm:flex')} aria-hidden>
                  <FactoryIcon className="h-5 w-5 text-brand-primary" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-3">
                     <h2 className="text-2xl font-bold tracking-tight text-card-foreground">
                       {factory.name}
                     </h2>
                     <span className="shrink-0 rounded-md border border-brand-primary/25 bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-brand-primary">
                       {factory.abbreviation}
                     </span>
                   </div>
                   <p className="text-sm text-muted-foreground mt-1 tabular-nums">{t('factoryIdLabel', { id: factory.id })}</p>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-2 pr-12 sm:pr-14">
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0 border-border"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('editFactoryButton')}
                  </Button>
                  <Button
                      size="sm"
                      className="h-9 shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => setIsAddSectionDialogOpen(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {t('addSection')}
                  </Button>
              </div>
            </div>

            <div className="p-4 space-y-4 bg-background">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
             {/* At a Glance Section */}
             <div className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('atAGlance')}
                </p>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className={neutralMetricTileClass} aria-hidden>
                      <Layers className={neutralMetricIconClass} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-3xl font-semibold tabular-nums leading-none text-card-foreground">
                        {sections.length}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {sections.length === 1 ? t('sectionLabelOne') : t('sectionLabelMany')}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-4 sm:border-l sm:border-border/60 sm:pl-5">
                    <div className={neutralMetricTileClass} aria-hidden>
                      <Cog className={neutralMetricIconClass} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-3xl font-semibold tabular-nums leading-none text-card-foreground">
                        {factoryMachines.length}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {factoryMachines.length === 1 ? t('machineLabelOne') : t('machineLabelMany')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          
          <div className="flex flex-col gap-6">
             {/* Machines Status Panel integrated */}
              <FactoryMachinesStatusPanel
                  factory={factory}
                  machines={factoryMachines}
                  machinesLoading={machinesLoading}
                  sections={sections}
                />
          </div>
        </div>

        {/* Factory Sections Horizontal Scroll Area or Drill-Down */}
        <div className="flex min-h-[350px] flex-col space-y-3 border-t border-border pt-3">
          {activeSectionId ? (() => {
            const activeSection = sections.find(s => s.id === activeSectionId);
            const activeSectionMachines = factoryMachines.filter(m => m.factory_section_id === activeSectionId);
            return (
              <div className="flex h-full min-h-0 flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveSectionId(null)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label={t('backToSections')}
                    title={t('backToSections')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Layers className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold">{activeSection?.name}</h3>
                  <span className="text-sm text-muted-foreground tabular-nums px-2 py-0.5 bg-muted rounded-md">{t('machinesInSection', { count: activeSectionMachines.length })}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8 shrink-0 border-border"
                    onClick={() => {
                      onClose();
                      navigate(`/machines?factoryId=${factoryId}&sectionId=${activeSectionId}`);
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('visitMachinePage')}
                  </Button>
                </div>
                
                {activeSectionMachines.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-card/30">
                    <Cog className="mb-3 h-8 w-8 opacity-40 mx-auto" />
                    {t('noMachinesInSection')}
                  </div>
                ) : (
                  <div className="relative w-full overflow-hidden">
                    <div
                      className="grid min-w-[732px] grid-cols-3 gap-3 overflow-x-auto overflow-y-auto pb-2"
                      onWheel={handleHorizontalWheelScroll}
                    >
                      {activeSectionMachines.map((m) => (
                        <div key={m.id} className="min-w-0">
                          <MachineListCardWithLatest
                            machine={m}
                            selected={false}
                            onSelect={() => {
                              onClose();
                              navigate(
                                `/machines?factoryId=${factoryId}&sectionId=${activeSectionId}&machineId=${m.id}`
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold">{t('sectionsHeading', { count: filteredSections.length })}</h3>
                </div>
                
                <div className="relative w-[min(200px,36vw)] min-w-[140px] shrink-0">
                    <Search
                      className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      type="text"
                      placeholder={t('searchSectionsPlaceholder')}
                      value={sectionSearchQuery}
                      onChange={(e) => setSectionSearchQuery(e.target.value)}
                      className="h-9 bg-background pl-10"
                    />
                </div>
              </div>

              <div className="relative w-full -mx-1 px-1 overflow-hidden">
                  <div 
                    className="flex w-full gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" 
                    onWheel={handleHorizontalWheelScroll}
                  >
                    {filteredSections.length === 0 ? (
                      <div className="flex w-full flex-col items-center justify-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                        <Layers className="mb-3 h-10 w-10 opacity-50" />
                        <p>
                          {sectionSearchQuery
                            ? t('noSectionsMatch')
                            : t('noSectionsYet')}
                        </p>
                        {!sectionSearchQuery && (
                          <Button
                            size="sm"
                            className="mt-4 bg-brand-primary hover:bg-brand-primary-hover"
                            onClick={() => setIsAddSectionDialogOpen(true)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            {t('addSection')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredSections.map((section) => {
                        const stats = sectionStats.get(section.id) || { total: 0, running: 0, notRunning: 0, maintDue: 0 };
                        return (
                        <FactorySectionCard
                          key={section.id}
                          section={section}
                          factoryName={factory.name}
                          stats={stats}
                          onOpen={() => setActiveSectionId(section.id)}
                          onEdit={() => handleEditSection(section)}
                          onDelete={() => handleDeleteSection(section)}
                          isDeleting={isDeletingSection}
                        />
                      );})
                    )}
                  </div>
              </div>
            </>
          )}
        </div>
          </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default FactoryDetailCard;
