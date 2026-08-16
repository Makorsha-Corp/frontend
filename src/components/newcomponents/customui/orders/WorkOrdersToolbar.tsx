import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AppShellHeaderInlineSearchField,
  AppShellHeaderInlineSearchToggle,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import WorkOrdersDateFilterControls from '@/components/newcomponents/customui/orders/WorkOrdersDateFilterControls';
import WorkOrdersMachineFilter from '@/components/newcomponents/customui/orders/WorkOrdersMachineFilter';
import { ShowCompleteOrdersSwitchControl } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';

export interface WorkOrdersToolbarProps {
  dateViewMode: WorkOrdersDateViewMode;
  sheetDate: string;
  weekPeriodLabel: string | null;
  onDateViewModeChange: (mode: WorkOrdersDateViewMode) => void;
  onPickDate: (iso: string) => void;
  onPickWeek: (iso: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  popoverFilterCount: number;
  filtersPopover: React.ReactNode;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  orderCountByDate?: Record<string, number>;
  calendarMonth?: Date;
  onCalendarMonthChange?: (month: Date) => void;
  machineFilter: string;
  onMachineChange: (value: string) => void;
  machineSelectDisabled?: boolean;
  factoryFilter: string;
  sectionFilter: string;
  machines: Machine[];
  factories: Factory[];
  sections: FactorySection[];
}

const toolbarShellClass = 'shrink-0 border-b border-border bg-card/50 px-4 py-2.5';

const dateFilterProps = (
  props: Pick<
    WorkOrdersToolbarProps,
    | 'dateViewMode'
    | 'sheetDate'
    | 'weekPeriodLabel'
    | 'onDateViewModeChange'
    | 'onPickDate'
    | 'onPickWeek'
    | 'orderCountByDate'
    | 'calendarMonth'
    | 'onCalendarMonthChange'
  >,
) => ({
  dateViewMode: props.dateViewMode,
  sheetDate: props.sheetDate,
  weekPeriodLabel: props.weekPeriodLabel,
  onDateViewModeChange: props.onDateViewModeChange,
  onPickDate: props.onPickDate,
  onPickWeek: props.onPickWeek,
  orderCountByDate: props.orderCountByDate,
  calendarMonth: props.calendarMonth,
  onCalendarMonthChange: props.onCalendarMonthChange,
});

const machineFilterProps = (
  props: Pick<
    WorkOrdersToolbarProps,
    | 'machineFilter'
    | 'onMachineChange'
    | 'machineSelectDisabled'
    | 'factoryFilter'
    | 'sectionFilter'
    | 'machines'
    | 'factories'
    | 'sections'
  >,
) => ({
  machineFilter: props.machineFilter,
  onMachineChange: props.onMachineChange,
  disabled: props.machineSelectDisabled,
  factoryFilter: props.factoryFilter,
  sectionFilter: props.sectionFilter,
  machines: props.machines,
  factories: props.factories,
  sections: props.sections,
});

function WorkOrdersFiltersButton({
  popoverFilterCount,
  filtersPopover,
}: {
  popoverFilterCount: number;
  filtersPopover: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={popoverFilterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          className={cn('shrink-0 gap-1.5', appShellHeaderControlClass)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {popoverFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
              {popoverFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(17rem,94vw)] p-0">
        {filtersPopover}
      </PopoverContent>
    </Popover>
  );
}

const WorkOrdersToolbar: React.FC<WorkOrdersToolbarProps> = (props) => {
  const {
    searchQuery,
    onSearchChange,
    popoverFilterCount,
    filtersPopover,
    showCompleteOrders,
    onShowCompleteOrdersChange,
    machineFilter,
  } = props;

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFiltersPanelOpen, setMobileFiltersPanelOpen] = useState(false);

  const mobileSheetFilterCount = useMemo(() => {
    let count = popoverFilterCount;
    if (machineFilter !== 'all') count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    return count;
  }, [popoverFilterCount, machineFilter, searchQuery]);

  const showCompleteControl = (
    <ShowCompleteOrdersSwitchControl
      checked={showCompleteOrders}
      onCheckedChange={onShowCompleteOrdersChange}
      context="sheet"
      ariaLabel="Show completed work orders"
    />
  );

  return (
    <>
      {/* Mobile */}
      <div className={cn(toolbarShellClass, 'lg:hidden')}>
        <div className="flex flex-nowrap items-center gap-2">
          <WorkOrdersDateFilterControls
            {...dateFilterProps(props)}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant={
              mobileFiltersPanelOpen || mobileSheetFilterCount > 0 ? 'secondary' : 'outline'
            }
            size="sm"
            className={cn('relative shrink-0 gap-1.5', appShellHeaderControlClass)}
            onClick={() => setMobileFiltersPanelOpen((open) => !open)}
            aria-expanded={mobileFiltersPanelOpen}
            aria-label={
              mobileSheetFilterCount > 0
                ? `Sheet filters (${mobileSheetFilterCount} active). ${mobileFiltersPanelOpen ? 'Collapse' : 'Expand'}`
                : mobileFiltersPanelOpen
                  ? 'Collapse sheet filters'
                  : 'Expand sheet filters'
            }
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            Filters
            {mobileSheetFilterCount > 0 ? (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                {mobileSheetFilterCount}
              </Badge>
            ) : null}
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 opacity-70 transition-transform',
                mobileFiltersPanelOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </Button>
        </div>

        {mobileFiltersPanelOpen ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <WorkOrdersMachineFilter
                {...machineFilterProps(props)}
                className="min-w-0 w-full sm:w-auto sm:flex-1 [&_button]:max-w-none"
              />
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto">
                <AppShellHeaderInlineSearchToggle
                  open={mobileSearchOpen}
                  onOpenChange={setMobileSearchOpen}
                  searchAriaLabel="Search work orders"
                />
                {showCompleteControl}
                <WorkOrdersFiltersButton
                  popoverFilterCount={popoverFilterCount}
                  filtersPopover={filtersPopover}
                />
              </div>
            </div>
            <AppShellHeaderInlineSearchField
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search WO# or description..."
              open={mobileSearchOpen}
              onOpenChange={setMobileSearchOpen}
            />
          </>
        ) : null}
      </div>

      {/* Desktop — unchanged layout */}
      <div
        className={cn(
          toolbarShellClass,
          'hidden flex-wrap items-center gap-2 lg:flex lg:flex-nowrap',
        )}
      >
        <WorkOrdersDateFilterControls {...dateFilterProps(props)} />

        <div className="ml-auto flex w-auto shrink-0 flex-nowrap items-center gap-2">
          <WorkOrdersMachineFilter {...machineFilterProps(props)} />

          <div className="relative min-w-[200px] max-w-md w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search WO# or description..."
              className={cn('pl-9', appShellHeaderControlClass, 'border-border bg-background')}
            />
          </div>

          {showCompleteControl}

          <WorkOrdersFiltersButton
            popoverFilterCount={popoverFilterCount}
            filtersPopover={filtersPopover}
          />
        </div>
      </div>
    </>
  );
};

export default WorkOrdersToolbar;
