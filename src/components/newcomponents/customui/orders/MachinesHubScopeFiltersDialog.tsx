import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  isFactoryRowChecked,
  isSectionRowChecked,
  locationFilterLabels,
  selectAllFactories,
  selectAllSections,
  selectSingleFactory,
  selectSingleSection,
  visibleSectionsForSlice,
  type MachinesLocationFilterSlice,
} from '@/lib/machinesLocationFilters';
import { cn } from '@/lib/utils';
import { SCROLL_TARGET_HIGHLIGHT_CLASS } from '@/lib/scrollTargetHighlight';

export interface MachinesHubScopeFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MachinesLocationFilterSlice;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  onApply: (next: MachinesLocationFilterSlice) => void;
  onClear: () => void;
  factoryPickerHighlight?: boolean;
  onFactoryPickerHighlightDismiss?: () => void;
}

const MachinesHubScopeFiltersDialog: React.FC<MachinesHubScopeFiltersDialogProps> = ({
  open,
  onOpenChange,
  value,
  factories,
  sections,
  onApply,
  onClear,
  factoryPickerHighlight = false,
  onFactoryPickerHighlightDismiss,
}) => {
  const [draft, setDraft] = React.useState<MachinesLocationFilterSlice>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const allFactoryIds = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const visibleSections = React.useMemo(
    () => visibleSectionsForSlice(draft, allFactoryIds, sections),
    [sections, draft, allFactoryIds],
  );

  const { factoryDropdownLabel, sectionDropdownLabel } = locationFilterLabels(
    draft,
    allFactoryIds,
    visibleSections,
    factories,
    sections,
  );

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[min(28rem,94vw)] max-w-none flex-col gap-4 p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>Location scope</DialogTitle>
          <DialogDescription>Filter machines and work orders by factory and section.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Factory</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-10 justify-between focus-visible:ring-inset',
                    factoryPickerHighlight && SCROLL_TARGET_HIGHLIGHT_CLASS,
                  )}
                  onMouseEnter={() => {
                    if (factoryPickerHighlight) onFactoryPickerHighlightDismiss?.();
                  }}
                  onClick={() => {
                    if (factoryPickerHighlight) onFactoryPickerHighlightDismiss?.();
                  }}
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
                    setDraft((p) => selectAllFactories(p, allFactoryIds, sections));
                  }}
                  className={cn(draft.factory_ids.length === 0 && 'bg-accent/70')}
                >
                  All Factories
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
                      onCheckedChange={() => {
                        const checked = isFactoryRowChecked(draft, f.id);
                        setDraft((p) =>
                          checked
                            ? selectAllFactories(p, allFactoryIds, sections)
                            : selectSingleFactory(p, f.id, allFactoryIds, sections),
                        );
                      }}
                    >
                      {f.name} <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="h-10 justify-between focus-visible:ring-inset">
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
                    setDraft((p) => selectAllSections(p));
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
                      onCheckedChange={() => {
                        const checked = isSectionRowChecked(draft, s.id);
                        setDraft((p) => (checked ? selectAllSections(p) : selectSingleSection(p, s.id)));
                      }}
                    >
                      {s.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function isMachinesHubLocationScopeFiltered(slice: MachinesLocationFilterSlice): boolean {
  return slice.factory_ids.length > 0 || slice.section_ids.length > 0;
}

export default MachinesHubScopeFiltersDialog;
