import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Factory as FactoryIcon,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import FactoriesFactoryAttentionPanel from '@/components/newcomponents/customui/factories/overview/FactoriesFactoryAttentionPanel';
import FactoriesFactoryActivityFeed from '@/components/newcomponents/customui/factories/overview/FactoriesFactoryActivityFeed';
import AddFactorySectionDialog from '@/components/newcomponents/customui/AddFactorySectionDialog';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import type {
  FactoryActivityItem,
  FactoryAttentionGroups,
} from '@/pages/newpages/factories/factoriesOverviewData';
import { brandIconGlyphClass, brandIconTileClass } from '@/lib/machineVisualStatus';
import { useDeleteFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import { cn } from '@/lib/utils';
import { appToast } from '@/lib/appToast';

const emptyAttention: FactoryAttentionGroups = {
  maintenanceDue: [],
  idle: [],
  off: [],
  unassigned: [],
  draftBatches: [],
};

function filterAttentionBySection(
  attention: FactoryAttentionGroups,
  scopedMachineIds: Set<number>
): FactoryAttentionGroups {
  return {
    maintenanceDue: attention.maintenanceDue.filter((row) =>
      row.machineId != null ? scopedMachineIds.has(row.machineId) : false
    ),
    idle: attention.idle.filter((row) => {
      const match = String(row.id).match(/^idle-(\d+)$/);
      return match != null && scopedMachineIds.has(Number(match[1]));
    }),
    off: attention.off.filter((row) => {
      const match = String(row.id).match(/^off-(\d+)$/);
      return match != null && scopedMachineIds.has(Number(match[1]));
    }),
    unassigned: [],
    draftBatches: attention.draftBatches,
  };
}

function filterActivityBySection(
  activity: FactoryActivityItem[],
  scopedMachineNames: Set<string>
): FactoryActivityItem[] {
  return activity.filter((item) => {
    if (item.description.startsWith('Storage:') || item.description.startsWith('Batch ')) {
      return true;
    }
    const machineName = item.description.split(' → ')[0];
    return scopedMachineNames.has(machineName);
  });
}

interface FactoriesFactoryDetailPanelProps {
  factory: Factory;
  machines: Machine[];
  sections: FactorySection[];
  attention: FactoryAttentionGroups | null;
  activity: FactoryActivityItem[];
  attentionLoading?: boolean;
  activityLoading?: boolean;
  onBack: () => void;
  onEditFactory: () => void;
}

const FactoriesFactoryDetailPanel: React.FC<FactoriesFactoryDetailPanelProps> = ({
  factory,
  machines,
  sections,
  attention,
  activity,
  attentionLoading,
  activityLoading,
  onBack,
  onEditFactory,
}) => {
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FactorySection | null>(null);
  const [sectionSearch, setSectionSearch] = useState('');

  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteFactorySectionMutation();

  useEffect(() => {
    setSelectedSectionId(null);
    setSectionsOpen(false);
    setSectionSearch('');
  }, [factory.id]);

  const selectedSection = useMemo(
    () => (selectedSectionId != null ? sections.find((s) => s.id === selectedSectionId) : null),
    [sections, selectedSectionId]
  );

  const filteredSections = useMemo(() => {
    if (!sectionSearch.trim()) return sections;
    const q = sectionSearch.toLowerCase();
    return sections.filter((section) => section.name.toLowerCase().includes(q));
  }, [sections, sectionSearch]);

  const scopedMachineIds = useMemo(() => {
    if (selectedSectionId == null) return null;
    return new Set(
      machines.filter((m) => m.factory_section_id === selectedSectionId).map((m) => m.id)
    );
  }, [machines, selectedSectionId]);

  const scopedMachineNames = useMemo(() => {
    if (selectedSectionId == null) return null;
    return new Set(
      machines.filter((m) => m.factory_section_id === selectedSectionId).map((m) => m.name)
    );
  }, [machines, selectedSectionId]);

  const displayAttention = useMemo(() => {
    const base = attention ?? emptyAttention;
    if (scopedMachineIds == null) return base;
    return filterAttentionBySection(base, scopedMachineIds);
  }, [attention, scopedMachineIds]);

  const displayActivity = useMemo(() => {
    if (scopedMachineNames == null) return activity;
    return filterActivityBySection(activity, scopedMachineNames);
  }, [activity, scopedMachineNames]);

  const handleSelectSection = (sectionId: number | null) => {
    setSelectedSectionId(sectionId);
    setSectionsOpen(false);
  };

  const handleDeleteSection = async (section: FactorySection) => {
    if (
      !window.confirm(`Are you sure you want to deactivate "${section.name}"? This is a soft delete.`)
    ) {
      return;
    }
    try {
      await deleteSection(section.id).unwrap();
      if (selectedSectionId === section.id) {
        setSelectedSectionId(null);
      }
      appToast.success(`Section "${section.name}" has been deactivated`);
    } catch (error: unknown) {
      const detail =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { detail?: string } }).data?.detail
          : undefined;
      appToast.error(detail || 'Failed to deactivate section');
    }
  };

  const sectionLabel = sections.length === 1 ? '1 section' : `${sections.length} sections`;
  const machineLabel = machines.length === 1 ? '1 machine' : `${machines.length} machines`;
  const sectionsButtonLabel = selectedSection?.name ?? 'Sections';

  return (
    <>
      <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-muted-foreground hover:text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <div className={brandIconTileClass} aria-hidden>
              <FactoryIcon className={brandIconGlyphClass} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-card-foreground">{factory.name}</p>
              <p className="text-xs text-muted-foreground">
                {factory.abbreviation} · #{factory.id} · {sectionLabel} · {machineLabel}
                {selectedSection ? ` · ${selectedSection.name}` : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={sectionsOpen} onOpenChange={setSectionsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    appShellHeaderControlClass,
                    'max-w-[min(200px,40vw)] gap-1.5 text-muted-foreground',
                    selectedSection && 'border-brand-primary/40 text-card-foreground'
                  )}
                  aria-expanded={sectionsOpen}
                >
                  <Layers className="h-4 w-4 shrink-0" />
                  <span className="truncate">{sectionsButtonLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" side="bottom" className="w-[min(320px,94vw)] p-0">
                <div className="border-b border-border px-3 py-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-card-foreground">Factory sections</p>
                    <Button
                      size="sm"
                      className="h-8 bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => {
                        setSectionsOpen(false);
                        setIsAddSectionOpen(true);
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <Input
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    placeholder="Search sections..."
                    className="h-8 bg-background"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60',
                      selectedSectionId == null && 'bg-accent/70'
                    )}
                    onClick={() => handleSelectSection(null)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 text-brand-primary',
                        selectedSectionId != null && 'opacity-0'
                      )}
                      aria-hidden
                    />
                    <span className="font-medium text-card-foreground">All sections</span>
                  </button>
                  {filteredSections.length === 0 ? (
                    <p className="px-2.5 py-3 text-sm text-muted-foreground">No sections found.</p>
                  ) : (
                    filteredSections.map((section) => {
                      const isSelected = selectedSectionId === section.id;
                      const sectionMachines = machines.filter(
                        (m) => m.factory_section_id === section.id
                      ).length;
                      return (
                        <div
                          key={section.id}
                          className={cn(
                            'flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-muted/60',
                            isSelected && 'bg-accent/70'
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm"
                            onClick={() => handleSelectSection(section.id)}
                          >
                            <Check
                              className={cn(
                                'h-4 w-4 shrink-0 text-brand-primary',
                                !isSelected && 'opacity-0'
                              )}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate font-medium text-card-foreground">
                              {section.name}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {sectionMachines} {sectionMachines === 1 ? 'machine' : 'machines'}
                            </span>
                          </button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 shrink-0 p-0 text-brand-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSectionsOpen(false);
                                    setEditingSection(section);
                                    setIsEditSectionOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit section</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 shrink-0 p-0 text-destructive"
                                  disabled={isDeletingSection}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteSection(section);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Deactivate section</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              className={appShellHeaderControlClass}
              onClick={onEditFactory}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit factory
            </Button>
          </div>
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <FactoriesFactoryAttentionPanel
              attention={displayAttention}
              loading={attentionLoading}
              className="min-h-0"
            />
            <FactoriesFactoryActivityFeed
              activities={displayActivity}
              loading={activityLoading}
              className="min-h-0"
            />
          </div>
        </CardContent>
      </Card>

      <AddFactorySectionDialog
        open={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        factoryId={factory.id}
        sections={sections}
      />
      <EditFactorySectionDialog
        open={isEditSectionOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSection(null);
          setIsEditSectionOpen(open);
        }}
        section={editingSection}
        sections={sections}
      />
    </>
  );
};

export default FactoriesFactoryDetailPanel;
