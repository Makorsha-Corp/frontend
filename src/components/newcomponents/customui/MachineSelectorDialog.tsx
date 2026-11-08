import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import type { Machine } from '@/types/machine';
import { API_LIMITS } from '@/constants/apiLimits';
import MachineSelectorTile, {
  activeMachines,
  filterAndSortMachines,
  MachineSelectorFooterStatus,
} from '@/components/newcomponents/customui/MachineSelectorTile';
import type {
  MachineLiveWorkMap,
  MachineScheduleOccupancyMap,
} from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import { plannedWindowIncludesNow } from '@/lib/machinePickerAvailability';
import {
  evaluateMachinePick,
  machinePickWarningLabel,
  type MachinePickContext,
  type MachinePickWarningReason,
  type ProductionMachinePickPolicy,
} from '@/lib/productionMachinePickPolicy';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2, Search } from 'lucide-react';
import { resolveFactoryId, useGlobalFactory } from '@/hooks/useGlobalFactoryContext';

/** Location labels for display in the parent form (factory has real abbreviation; section uses a short derived label — no `abbreviation` field on sections today). */
export interface MachineSelectionContext {
  factoryAbbreviation: string;
  sectionAbbreviation: string;
  machineName: string;
}

export function deriveSectionAbbreviation(sectionName: string): string {
  const t = sectionName.trim();
  if (!t) return '—';
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  }
  return words[0].slice(0, Math.min(3, words[0].length)).toUpperCase();
}

export interface MachineSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single-select: called when the user confirms **Select machine**. */
  onSelect?: (machine: Machine, context: MachineSelectionContext) => void;
  selectionMode?: 'single' | 'multiple';
  /** Multi-select: seed when the dialog opens. */
  selectedIds?: number[];
  /** Multi-select: called when the user clicks **Apply selection**. */
  onConfirmMultiple?: (ids: number[]) => void;
  /** When the dialog opens, pre-select this factory (optional). */
  initialFactoryId?: number;
  /** When the dialog opens, pre-select this section (optional; must belong to factory). */
  initialSectionId?: number;
  title?: string;
  /** Muted line under title (e.g. production line name). */
  titleDetail?: string;
  /** Omit or pass empty to hide; batch line picker skips color legend by default. */
  description?: string | null;
  /** When set, list only these machines and hide factory/section pickers (requires `initialFactoryId`). */
  allowedMachineIds?: number[];
  /** Per-machine free/scheduled badges for a planned window (optional). */
  occupancyByMachineId?: MachineScheduleOccupancyMap;
  /** In-progress batch per machine (busy-now tooltips). */
  liveWorkByMachineId?: MachineLiveWorkMap;
  /** Step planned window (for availability labels and live overlap). */
  plannedWindow?: { plannedStartAt: string; plannedEndAt: string } | null;
  /** Clear current selection and close (production step machine optional until start). */
  onClearSelection?: () => void;
  clearSelectionLabel?: string;
  /** Batch step machine pick: enforce workspace policy on this line-scoped dialog. */
  applyProductionPickPolicy?: boolean;
  productionMachinePickPolicy?: ProductionMachinePickPolicy;
  /** When pick has warnings under soft policy, parent shows confirm dialog before closing. */
  onRequestPickConfirmation?: (
    machine: Machine,
    warnings: MachinePickWarningReason[],
    context: MachineSelectionContext,
  ) => void;
  /** Stage log being assigned (exempt from live-step conflict). */
  excludeStageLogId?: number;
}

const MachineSelectorDialog: React.FC<MachineSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectionMode = 'single',
  selectedIds = [],
  onConfirmMultiple,
  initialFactoryId,
  initialSectionId,
  title,
  titleDetail,
  description,
  allowedMachineIds,
  occupancyByMachineId,
  liveWorkByMachineId,
  plannedWindow,
  onClearSelection,
  clearSelectionLabel = 'Clear machine',
  applyProductionPickPolicy = false,
  productionMachinePickPolicy = 'soft',
  onRequestPickConfirmation,
  excludeStageLogId,
}) => {
  const isMultiple = selectionMode === 'multiple';
  const lineScoped = allowedMachineIds != null && allowedMachineIds.length > 0;
  const factoryLocked = isMultiple && initialFactoryId != null;
  const batchLinePicker = applyProductionPickPolicy && lineScoped && !isMultiple;
  const resolvedDescription =
    description !== undefined
      ? description
      : batchLinePicker
        ? null
        : isMultiple
          ? 'Click machines to add or remove them from this line. Green = running, yellow = maintenance, red = idle/off.'
          : lineScoped
            ? 'Green = available. Amber = planned or a step in progress. Red/off = unavailable.'
            : 'Choose a factory (section optional), then pick a machine. Green = running, yellow = maintenance, red = not running (idle/off).';
  const resolvedTitle =
    title ??
    (batchLinePicker ? 'Pick a machine' : isMultiple ? 'Choose machines' : 'Select machine');
  const [factoryId, setFactoryId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState<Machine | null>(null);
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<number>>(() => new Set());
  const globalFactory = useGlobalFactory();

  const { data: factories = [], isLoading: factoriesLoading } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  const { data: sections = [], isLoading: sectionsLoading } = useGetFactorySectionsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000, factory_id: factoryId },
    { skip: !open || !factoryId }
  );

  const { data: machinesRaw = [], isLoading: machinesLoading } = useGetMachinesQuery(
    {
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      factory_id: factoryId,
      factory_section_id: sectionId,
    },
    { skip: !open || !factoryId }
  );

  useEffect(() => {
    if (!open) {
      setFactoryId(undefined);
      setSectionId(undefined);
      setSearch('');
      setHighlighted(null);
      setDraftSelectedIds(new Set());
      return;
    }
    setFactoryId(resolveFactoryId(initialFactoryId, globalFactory?.id ?? null));
    setSectionId(initialSectionId);
    setSearch('');
    setHighlighted(null);
    setDraftSelectedIds(new Set(selectedIds));
    // Seed defaults only when the dialog opens — not when global factory changes while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allowedIdSet = useMemo(
    () => (allowedMachineIds?.length ? new Set(allowedMachineIds) : null),
    [allowedMachineIds],
  );

  const batchPickContext: MachinePickContext | undefined = useMemo(() => {
    if (!applyProductionPickPolicy || !lineScoped) return undefined;
    const hasPlannedWindow = occupancyByMachineId != null;
    return {
      hasPlannedWindow,
      plannedWindow: plannedWindow ?? null,
      windowIncludesNow: hasPlannedWindow
        ? plannedWindowIncludesNow(plannedWindow ?? null)
        : plannedWindowIncludesNow(undefined),
    };
  }, [applyProductionPickPolicy, lineScoped, occupancyByMachineId, plannedWindow]);

  const pickContextForMachine = (machineId: number): MachinePickContext | undefined => {
    if (!batchPickContext) return undefined;
    return {
      ...batchPickContext,
      liveWorkOnMachine: liveWorkByMachineId?.[machineId] ?? null,
      excludeStageLogId,
    };
  };

  const batchPickerTileContext = useMemo(() => {
    if (!batchPickContext?.hasPlannedWindow) return undefined;
    return {
      hasPlannedWindow: true,
      windowIncludesNow: batchPickContext.windowIncludesNow ?? false,
    };
  }, [batchPickContext]);

  const machines = useMemo(() => {
    let list = activeMachines(machinesRaw);
    if (allowedIdSet) {
      list = list.filter((m) => allowedIdSet.has(m.id));
    }
    return filterAndSortMachines(list, search);
  }, [machinesRaw, search, allowedIdSet]);

  const buildSelectionContext = (machine: Machine): MachineSelectionContext => {
    const factory = factories.find((f) => f.id === factoryId);
    const section = sectionId != null ? sections.find((s) => s.id === sectionId) : undefined;
    const machineSectionName = machine.factory_section_name?.trim();
    return {
      factoryAbbreviation: factory?.abbreviation?.trim() || '—',
      sectionAbbreviation: section
        ? deriveSectionAbbreviation(section.name)
        : machineSectionName
          ? deriveSectionAbbreviation(machineSectionName)
          : '—',
      machineName: machine.name,
    };
  };

  const confirmSelection = () => {
    if (!highlighted || factoryId == null || !onSelect) return;
    const occupancy = occupancyByMachineId?.[highlighted.id];
    if (applyProductionPickPolicy && lineScoped) {
      const evaluation = evaluateMachinePick(
        highlighted,
        productionMachinePickPolicy,
        occupancy,
        pickContextForMachine(highlighted.id),
      );
      if (evaluation.blocked) return;
      if (evaluation.warnings.length > 0 && onRequestPickConfirmation) {
        onRequestPickConfirmation(highlighted, evaluation.warnings, buildSelectionContext(highlighted));
        return;
      }
    }
    onSelect(highlighted, buildSelectionContext(highlighted));
    onOpenChange(false);
  };

  const confirmMultipleSelection = () => {
    onConfirmMultiple?.(Array.from(draftSelectedIds));
    onOpenChange(false);
  };

  const highlightedPickBlocked = useMemo(() => {
    if (!highlighted || !applyProductionPickPolicy || !lineScoped) return false;
    const occupancy = occupancyByMachineId?.[highlighted.id];
    return evaluateMachinePick(
      highlighted,
      productionMachinePickPolicy,
      occupancy,
      pickContextForMachine(highlighted.id),
    ).blocked;
  }, [
    highlighted,
    applyProductionPickPolicy,
    lineScoped,
    occupancyByMachineId,
    productionMachinePickPolicy,
    batchPickContext,
    liveWorkByMachineId,
    excludeStageLogId,
  ]);

  const toggleDraftMachine = (machineId: number) => {
    setDraftSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(machineId)) next.delete(machineId);
      else next.add(machineId);
      return next;
    });
  };

  const handleFactoryChange = (value: string) => {
    const id = value === '__none__' ? undefined : parseInt(value, 10);
    setFactoryId(id);
    setSectionId(undefined);
    setHighlighted(null);
  };

  const handleSectionChange = (value: string) => {
    const id = value === '__none__' ? undefined : parseInt(value, 10);
    setSectionId(id);
    setHighlighted(null);
  };

  const sectionFilter = (
    <div className="space-y-2">
      <Label>Factory section</Label>
      <Select
        value={sectionId?.toString() ?? '__none__'}
        onValueChange={handleSectionChange}
        disabled={!factoryId || sectionsLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              !factoryId
                ? 'Choose a factory first'
                : sectionsLoading
                  ? 'Loading…'
                  : 'All sections'
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">All sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(520px,78dvh)] w-full max-w-xl flex-col gap-0 overflow-hidden p-5 sm:p-6">
        <DialogHeader className="shrink-0 space-y-1 pb-4 text-left">
          <DialogTitle className="text-brand-heading">
            {titleDetail?.trim() ? (
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span>{resolvedTitle}</span>
                <span className="text-sm font-normal text-muted-foreground">{titleDetail.trim()}</span>
              </span>
            ) : (
              resolvedTitle
            )}
          </DialogTitle>
          {resolvedDescription ? (
            <DialogDescription>{resolvedDescription}</DialogDescription>
          ) : batchLinePicker ? (
            <DialogDescription className="sr-only">
              Choose a machine on {titleDetail?.trim() || 'this line'} for the planned step window.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {!lineScoped && factoryLocked ? (
            <div className="shrink-0">{sectionFilter}</div>
          ) : null}
          {!lineScoped && !factoryLocked ? (
            <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Factory *</Label>
                <Select
                  value={factoryId?.toString() ?? '__none__'}
                  onValueChange={handleFactoryChange}
                  disabled={factoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={factoriesLoading ? 'Loading…' : 'Select factory'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select factory…</SelectItem>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name} ({f.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {sectionFilter}
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1">
            {!factoryId ? (
              <div className="flex h-full min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-2 text-center text-sm text-muted-foreground">
                Select a factory to load machines.
              </div>
            ) : machinesLoading ? (
              <div className="flex h-full min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading machines…
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search machines…"
                      className="h-9 pl-8"
                      autoComplete="off"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{machines.length} shown</span>
                </div>
                <div className="max-h-[min(200px,32dvh)] overflow-y-auto rounded-lg border border-border bg-muted/10 p-2 sm:p-3">
                  {machines.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No machines in this factory{sectionId ? ' section' : ''}{search.trim() ? ' match your search' : ''}.
                    </p>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                    <div
                      className="grid grid-cols-2 gap-1.5 sm:gap-2"
                      role="listbox"
                      aria-label="Machines in factory"
                    >
                      {machines.map((m) => {
                        const occupancy = occupancyByMachineId?.[m.id];
                        const pickEval =
                          applyProductionPickPolicy && lineScoped
                            ? evaluateMachinePick(
                                m,
                                productionMachinePickPolicy,
                                occupancy,
                                pickContextForMachine(m.id),
                              )
                            : null;
                        const pickBlocked = pickEval?.blocked ?? false;
                        const pickBlockedReason = pickBlocked
                          ? machinePickWarningLabel(
                              pickEval!.warnings.find(
                                (w) =>
                                  w === 'maintenance' ||
                                  w === 'off' ||
                                  w === 'occupied' ||
                                  w === 'schedule_overlap',
                              ) ?? pickEval!.warnings[0]!,
                            )
                          : undefined;
                        return (
                          <MachineSelectorTile
                            key={m.id}
                            machine={m}
                            isHighlighted={!isMultiple && highlighted?.id === m.id}
                            isSelected={isMultiple && draftSelectedIds.has(m.id)}
                            onPick={() =>
                              isMultiple ? toggleDraftMachine(m.id) : setHighlighted(m)
                            }
                            scheduleOccupancy={occupancy}
                            batchPickerContext={
                              batchPickerTileContext
                                ? {
                                    ...batchPickerTileContext,
                                    liveWork: liveWorkByMachineId?.[m.id] ?? null,
                                  }
                                : undefined
                            }
                            pickBlocked={pickBlocked}
                            pickBlockedReason={pickBlockedReason}
                          />
                        );
                      })}
                    </div>
                    </TooltipProvider>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {isMultiple ? (
              <>
                {draftSelectedIds.size === 0
                  ? 'No machines selected.'
                  : `${draftSelectedIds.size} machine${draftSelectedIds.size === 1 ? '' : 's'} selected.`}
              </>
            ) : highlighted ? (
              <>
                Selected: <MachineSelectorFooterStatus machine={highlighted} />
              </>
            ) : (
              <>Click a machine to highlight it, then confirm below.</>
            )}
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {!isMultiple && onClearSelection ? (
              <Button
                type="button"
                variant="outline"
                title="Remove machine choice for this step"
                onClick={() => {
                  onClearSelection();
                  onOpenChange(false);
                }}
              >
                {clearSelectionLabel}
              </Button>
            ) : null}
            {isMultiple ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            ) : null}
            {isMultiple ? (
              <Button
                type="button"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={factoryId == null}
                onClick={confirmMultipleSelection}
              >
                Apply selection ({draftSelectedIds.size})
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={!highlighted || factoryId == null || highlightedPickBlocked}
                onClick={confirmSelection}
              >
                Select machine
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MachineSelectorDialog;
