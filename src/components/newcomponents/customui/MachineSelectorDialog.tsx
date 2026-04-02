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
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';

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
  /** Called when the user highlights a machine and clicks **Select machine** in the footer. */
  onSelect: (machine: Machine, context: MachineSelectionContext) => void;
  /** When the dialog opens, pre-select this factory (optional). */
  initialFactoryId?: number;
  /** When the dialog opens, pre-select this section (optional; must belong to factory). */
  initialSectionId?: number;
  title?: string;
  description?: string;
}

const activeMachines = (list: Machine[] | undefined) =>
  (list ?? []).filter((m) => m.is_active && !m.is_deleted);

const MachineSelectorDialog: React.FC<MachineSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  initialFactoryId,
  initialSectionId,
  title = 'Select machine',
  description = 'Choose a factory and section, then pick a machine from the grid. Running machines are highlighted.',
}) => {
  const [factoryId, setFactoryId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState<Machine | null>(null);

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
      factory_section_id: sectionId,
    },
    { skip: !open || !sectionId }
  );

  useEffect(() => {
    if (!open) {
      setFactoryId(undefined);
      setSectionId(undefined);
      setSearch('');
      setHighlighted(null);
      return;
    }
    setFactoryId(initialFactoryId);
    setSectionId(initialSectionId);
    setSearch('');
    setHighlighted(null);
  }, [open, initialFactoryId, initialSectionId]);

  const machines = useMemo(() => {
    const list = activeMachines(machinesRaw);
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.model_number && m.model_number.toLowerCase().includes(q)) ||
            (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
        )
      : list;
    return [...filtered].sort((a, b) => {
      if (a.is_running !== b.is_running) return a.is_running ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [machinesRaw, search]);

  const confirmSelection = () => {
    if (!highlighted || factoryId == null || sectionId == null) return;
    const factory = factories.find((f) => f.id === factoryId);
    const section = sections.find((s) => s.id === sectionId);
    onSelect(highlighted, {
      factoryAbbreviation: factory?.abbreviation?.trim() || '—',
      sectionAbbreviation: section ? deriveSectionAbbreviation(section.name) : '—',
      machineName: highlighted.name,
    });
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(520px,78dvh)] w-full max-w-xl flex-col gap-0 overflow-hidden p-5 sm:p-6">
        <DialogHeader className="shrink-0 space-y-1 pb-4 text-left">
          <DialogTitle className="text-brand-secondary">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
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
            <div className="space-y-2">
              <Label>Factory section *</Label>
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
                          : 'Select section…'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select section…</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {!sectionId ? (
              <div className="flex h-full min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-2 text-center text-sm text-muted-foreground">
                Select a factory and section to load machines.
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
                      No machines in this section{search.trim() ? ' match your search' : ''}.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-2 gap-1.5 sm:gap-2"
                      role="listbox"
                      aria-label="Machines in section"
                    >
                      {machines.map((m) => {
                        const running = m.is_running;
                        const isHighlighted = highlighted?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            role="option"
                            aria-selected={isHighlighted}
                            onClick={() => setHighlighted(m)}
                            className={cn(
                              'flex min-h-[4.75rem] flex-col rounded-md border bg-card text-left shadow-sm outline-none transition-colors',
                              'hover:border-brand-primary/50 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-brand-primary',
                              running
                                ? 'border-emerald-500/40 ring-1 ring-emerald-500/15'
                                : 'border-border',
                              isHighlighted &&
                                'ring-2 ring-brand-primary ring-offset-2 ring-offset-background border-brand-primary'
                            )}
                          >
                            <div
                              className={cn(
                                'h-1.5 shrink-0 rounded-t-md',
                                running ? 'bg-emerald-500' : 'bg-muted-foreground/25'
                              )}
                              aria-hidden
                            />
                            <div className="flex flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
                              <span className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                                {m.name}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-semibold uppercase tracking-wide',
                                  running ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                                )}
                              >
                                {running ? 'Running' : 'Not running'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {highlighted ? (
              <>
                Selected: <span className="font-medium text-foreground">{highlighted.name}</span>
                {highlighted.is_running ? (
                  <span className="text-emerald-600 dark:text-emerald-400"> · Running</span>
                ) : null}
              </>
            ) : (
              <>Click a machine to highlight it, then confirm below.</>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={!highlighted || factoryId == null || sectionId == null}
              onClick={confirmSelection}
            >
              Select machine
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MachineSelectorDialog;
