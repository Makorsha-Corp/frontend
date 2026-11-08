import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  localizedToolbarFactoryDropdownLabel,
  localizedToolbarSectionDropdownLabel,
} from '@/i18n/factoryScopeLabels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  computeToggleFactory,
  computeToggleSection,
  isFactoryRowChecked,
  isSectionRowChecked,
  selectAllFactories,
  selectAllSections,
  visibleSectionsForSlice,
} from '@/lib/machinesLocationFilters';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
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

const ADVANCED_FILTER_DEFAULTS: Pick<
  MachinesFiltersValue,
  | 'running_status'
  | 'maintenance_window'
  | 'has_model_number'
  | 'has_manufacturer'
  | 'latest_event_type'
  | 'sort_by'
  | 'sort_dir'
  | 'factory_ids'
  | 'section_ids'
> = {
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

export function countMachinesAdvancedFilters(
  filters: MachinesFiltersValue,
  showLocationFilters: boolean,
): number {
  let count = 0;
  if (filters.running_status !== ADVANCED_FILTER_DEFAULTS.running_status) count += 1;
  if (filters.maintenance_window !== ADVANCED_FILTER_DEFAULTS.maintenance_window) count += 1;
  if (filters.has_model_number !== ADVANCED_FILTER_DEFAULTS.has_model_number) count += 1;
  if (filters.has_manufacturer !== ADVANCED_FILTER_DEFAULTS.has_manufacturer) count += 1;
  if (filters.latest_event_type !== ADVANCED_FILTER_DEFAULTS.latest_event_type) count += 1;
  if (filters.sort_by !== ADVANCED_FILTER_DEFAULTS.sort_by) count += 1;
  if (filters.sort_dir !== ADVANCED_FILTER_DEFAULTS.sort_dir) count += 1;
  if (showLocationFilters) {
    if (filters.factory_ids.length > 0) count += 1;
    if (filters.section_ids.length > 0) count += 1;
  }
  return count;
}

export interface MachinesFiltersPopoverProps {
  value: MachinesFiltersValue;
  factories: Array<{ id: number; name: string; abbreviation: string }>;
  sections: Array<{ id: number; name: string; factory_id: number }>;
  onApply: (next: MachinesFiltersValue) => void;
  onClear: () => void;
  showLocationFilters?: boolean;
}

const MachinesFiltersPopover: React.FC<MachinesFiltersPopoverProps> = ({
  value,
  factories,
  sections,
  onApply,
  onClear,
  showLocationFilters = true,
}) => {
  const { t } = useTranslation('machines');
  const { t: tFactories } = useTranslation('factories');
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<MachinesFiltersValue>(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const filterCount = React.useMemo(
    () => countMachinesAdvancedFilters(value, showLocationFilters),
    [value, showLocationFilters],
  );

  const allFactoryIds = React.useMemo(() => factories.map((f) => f.id), [factories]);

  const visibleSections = React.useMemo(
    () => visibleSectionsForSlice(draft, allFactoryIds, sections),
    [sections, draft, allFactoryIds],
  );

  const toggleFactory = (id: number) => {
    setDraft((p) => ({ ...p, ...computeToggleFactory(p, id, allFactoryIds, sections) }));
  };

  const toggleSection = (id: number) => {
    setDraft((p) => ({ ...p, ...computeToggleSection(p, id, allFactoryIds, sections) }));
  };

  const visibleSectionCount = visibleSections.length;
  const factoryDropdownLabel = localizedToolbarFactoryDropdownLabel(
    { factory_ids: draft.factory_ids, section_ids: draft.section_ids },
    allFactoryIds,
    factories,
    tFactories,
  );
  const sectionDropdownLabel = localizedToolbarSectionDropdownLabel(
    { factory_ids: draft.factory_ids, section_ids: draft.section_ids },
    visibleSectionCount,
    visibleSections,
    sections,
    tFactories,
  );

  const applyDraft = () => {
    onApply({ ...draft, search: value.search });
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={filterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          className={cn(
            'shrink-0 gap-1.5 border-border bg-background focus-visible:ring-offset-0',
            appShellHeaderControlClass,
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('filters')}
          {filterCount > 0 ? (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
              {filterCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(20rem,94vw)] p-0"
        onCloseAutoFocus={preventRadixCloseAutoFocus}
      >
        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto p-3">
          {showLocationFilters ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>{tFactories('labelFactories')}</Label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="h-9 justify-between">
                      <span className="truncate">{factoryDropdownLabel}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                    align="start"
                  >
                    <DropdownMenuLabel>{tFactories('labelFactories')}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setDraft((p) => ({ ...p, ...selectAllFactories(p, allFactoryIds, sections) }));
                      }}
                      className={cn(draft.factory_ids.length === 0 && 'bg-accent/70')}
                    >
                      {tFactories('menuAllFactories')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {factories.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">{tFactories('menuNoFactories')}</div>
                    ) : (
                      factories.map((f) => (
                        <DropdownMenuCheckboxItem
                          key={f.id}
                          checked={isFactoryRowChecked(draft, f.id)}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={() => toggleFactory(f.id)}
                        >
                          {f.name}{' '}
                          <span className="ml-1 text-muted-foreground">({f.abbreviation})</span>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid gap-2">
                <Label>{tFactories('labelSections')}</Label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="h-9 justify-between">
                      <span className="truncate">{sectionDropdownLabel}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                    align="start"
                  >
                    <DropdownMenuLabel>{tFactories('labelSections')}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setDraft((p) => ({ ...p, ...selectAllSections(p) }));
                      }}
                      className={cn(draft.section_ids.length === 0 && 'bg-accent/70')}
                    >
                      {tFactories('allSections')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {visibleSections.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {tFactories('menuNoSectionsForFilter')}
                      </div>
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
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t('filterRunningStatus')}</Label>
              <Select
                value={draft.running_status}
                onValueChange={(v: MachinesFiltersValue['running_status']) =>
                  setDraft((p) => ({ ...p, running_status: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="running">{t('running')}</SelectItem>
                  <SelectItem value="not_running">{t('notRunning')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('filterUpcomingWork')}</Label>
              <Select
                value={draft.maintenance_window}
                onValueChange={(v: MachinesFiltersValue['maintenance_window']) =>
                  setDraft((p) => ({ ...p, maintenance_window: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="overdue">{t('filterOverdue')}</SelectItem>
                  <SelectItem value="next_7_days">{t('filterNext7Days')}</SelectItem>
                  <SelectItem value="next_30_days">{t('filterNext30Days')}</SelectItem>
                  <SelectItem value="none_scheduled">{t('filterNoUpcomingWork')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('filterLatestEventType')}</Label>
              <Select
                value={draft.latest_event_type}
                onValueChange={(v: MachinesFiltersValue['latest_event_type']) =>
                  setDraft((p) => ({ ...p, latest_event_type: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="RUNNING">{t('running')}</SelectItem>
                  <SelectItem value="MAINTENANCE">{t('maintenance')}</SelectItem>
                  <SelectItem value="IDLE">{t('idle')}</SelectItem>
                  <SelectItem value="OFF">{t('off')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('filterHasModelNumber')}</Label>
              <Select
                value={draft.has_model_number}
                onValueChange={(v: MachinesFiltersValue['has_model_number']) =>
                  setDraft((p) => ({ ...p, has_model_number: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="yes">{t('filterYes')}</SelectItem>
                  <SelectItem value="no">{t('filterNo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('filterHasManufacturer')}</Label>
              <Select
                value={draft.has_manufacturer}
                onValueChange={(v: MachinesFiltersValue['has_manufacturer']) =>
                  setDraft((p) => ({ ...p, has_manufacturer: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="yes">{t('filterYes')}</SelectItem>
                  <SelectItem value="no">{t('filterNo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('filterSortBy')}</Label>
              <Select
                value={draft.sort_by}
                onValueChange={(v: MachinesFiltersValue['sort_by']) =>
                  setDraft((p) => ({ ...p, sort_by: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="name">{t('filterSortName')}</SelectItem>
                  <SelectItem value="created_at">{t('filterSortCreated')}</SelectItem>
                  <SelectItem value="maintenance_date">{t('filterSortNextWork')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>{t('filterSortDirection')}</Label>
              <Select
                value={draft.sort_dir}
                onValueChange={(v: MachinesFiltersValue['sort_dir']) =>
                  setDraft((p) => ({ ...p, sort_dir: v }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent onCloseAutoFocus={preventRadixCloseAutoFocus}>
                  <SelectItem value="asc">{t('filterSortAsc')}</SelectItem>
                  <SelectItem value="desc">{t('filterSortDesc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border p-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={handleClear}>
            {t('filterReset')}
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1 bg-brand-primary hover:bg-brand-primary-hover"
            onClick={applyDraft}
          >
            {t('filterApply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MachinesFiltersPopover;
