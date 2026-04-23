import React from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import {
  computeToggleFactory,
  computeToggleSection,
  isFactoryRowChecked,
  isSectionRowChecked,
  locationFilterLabels,
  selectAllFactories,
  selectAllSections,
  visibleSectionsForSlice,
} from '@/lib/machinesLocationFilters';
import { cn } from '@/lib/utils';

export interface MachinesFiltersValue {
  search: string;
  running_status: 'all' | 'running' | 'not_running';
  maintenance_window: 'all' | 'overdue' | 'next_7_days' | 'next_30_days' | 'none_scheduled';
  has_model_number: 'all' | 'yes' | 'no';
  has_manufacturer: 'all' | 'yes' | 'no';
  latest_event_type: 'all' | 'IDLE' | 'RUNNING' | 'OFF' | 'MAINTENANCE';
  sort_by: 'name' | 'created_at' | 'maintenance_date';
  sort_dir: 'asc' | 'desc';
  factory_ids: number[];
  section_ids: number[];
}

interface MachinesFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MachinesFiltersValue;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  onApply: (next: MachinesFiltersValue) => void;
  onClear: () => void;
}

const MachinesFiltersDialog: React.FC<MachinesFiltersDialogProps> = ({
  open,
  onOpenChange,
  value,
  factories,
  sections,
  onApply,
  onClear,
}) => {
  const [draft, setDraft] = React.useState<MachinesFiltersValue>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const allFactoryIds = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const visibleSections = React.useMemo(
    () => visibleSectionsForSlice(draft, allFactoryIds, sections),
    [sections, draft.factory_ids, allFactoryIds]
  );

  const toggleFactory = (id: number) => {
    setDraft((p) => ({ ...p, ...computeToggleFactory(p, id, allFactoryIds, sections) }));
  };

  const toggleSection = (id: number) => {
    setDraft((p) => ({ ...p, ...computeToggleSection(p, id, allFactoryIds, sections) }));
  };

  const { factoryDropdownLabel, sectionDropdownLabel } = locationFilterLabels(
    draft,
    allFactoryIds,
    visibleSections,
    factories,
    sections
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(64rem,96vw)] max-w-none flex-col gap-4 overflow-y-hidden overflow-x-visible p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>Machines Filters</DialogTitle>
          <DialogDescription>
            Refine machine results with advanced filters. Apply to update results and URL.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto overflow-x-hidden md:grid-cols-3">
          <div className="min-h-0 space-y-4 pr-1">
            <div className="grid gap-2">
              <Label htmlFor="machines-filter-search">Search</Label>
              <Input
                id="machines-filter-search"
                value={draft.search}
                onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
                className="focus-visible:ring-inset"
                placeholder="Name, model, manufacturer..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Factories</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-between focus-visible:ring-inset"
                  >
                    <span className="truncate">{factoryDropdownLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                  align="start"
                >
                  <DropdownMenuLabel>Factories</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setDraft((p) => ({ ...p, ...selectAllFactories(p, allFactoryIds, sections) }));
                    }}
                    className={cn(draft.factory_ids.length === 0 && 'bg-accent/70')}
                  >
                    All factories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {factories.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No factories</div>
                  ) : (
                    factories.map((f) => (
                      <DropdownMenuCheckboxItem
                        key={f.id}
                        checked={isFactoryRowChecked(draft, f.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={() => toggleFactory(f.id)}
                      >
                        {f.name} <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Choose All factories, or check one or more to narrow.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Sections</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-between focus-visible:ring-inset"
                  >
                    <span className="truncate">{sectionDropdownLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                  align="start"
                >
                  <DropdownMenuLabel>Sections</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setDraft((p) => ({ ...p, ...selectAllSections(p) }));
                    }}
                    className={cn(draft.section_ids.length === 0 && 'bg-accent/70')}
                  >
                    All sections
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {visibleSections.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No sections for this filter</div>
                  ) : (
                    visibleSections.map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s.id}
                        checked={isSectionRowChecked(draft, s.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={() => toggleSection(s.id)}
                      >
                        {s.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Choose All sections, or check one or more to narrow.
              </p>
            </div>
          </div>

          <div className="min-h-0 space-y-4 pr-1">
            <div className="grid gap-2">
              <Label>Running status</Label>
              <Select
                value={draft.running_status}
                onValueChange={(v: MachinesFiltersValue['running_status']) =>
                  setDraft((p) => ({ ...p, running_status: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="not_running">Not running</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Maintenance window</Label>
              <Select
                value={draft.maintenance_window}
                onValueChange={(v: MachinesFiltersValue['maintenance_window']) =>
                  setDraft((p) => ({ ...p, maintenance_window: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="next_7_days">Next 7 days</SelectItem>
                  <SelectItem value="next_30_days">Next 30 days</SelectItem>
                  <SelectItem value="none_scheduled">None scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Latest event type</Label>
              <Select
                value={draft.latest_event_type}
                onValueChange={(v: MachinesFiltersValue['latest_event_type']) =>
                  setDraft((p) => ({ ...p, latest_event_type: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="IDLE">Idle</SelectItem>
                  <SelectItem value="OFF">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-0 space-y-4 pr-1">
            <div className="grid gap-2">
              <Label>Has model number</Label>
              <Select
                value={draft.has_model_number}
                onValueChange={(v: MachinesFiltersValue['has_model_number']) =>
                  setDraft((p) => ({ ...p, has_model_number: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Has manufacturer</Label>
              <Select
                value={draft.has_manufacturer}
                onValueChange={(v: MachinesFiltersValue['has_manufacturer']) =>
                  setDraft((p) => ({ ...p, has_manufacturer: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Sort by</Label>
              <Select
                value={draft.sort_by}
                onValueChange={(v: MachinesFiltersValue['sort_by']) =>
                  setDraft((p) => ({ ...p, sort_by: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created_at">Created date</SelectItem>
                  <SelectItem value="maintenance_date">Maintenance date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Sort direction</Label>
              <Select
                value={draft.sort_dir}
                onValueChange={(v: MachinesFiltersValue['sort_dir']) =>
                  setDraft((p) => ({ ...p, sort_dir: v }))
                }
              >
                <SelectTrigger className="focus-visible:ring-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClear}>
            Clear all
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={() => onApply(draft)}
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MachinesFiltersDialog;
