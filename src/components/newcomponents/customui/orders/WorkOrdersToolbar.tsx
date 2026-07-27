import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
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

const WorkOrdersToolbar: React.FC<WorkOrdersToolbarProps> = ({
  dateViewMode,
  sheetDate,
  weekPeriodLabel,
  onDateViewModeChange,
  onPickDate,
  onPickWeek,
  searchQuery,
  onSearchChange,
  popoverFilterCount,
  filtersPopover,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  orderCountByDate,
  calendarMonth,
  onCalendarMonthChange,
  machineFilter,
  onMachineChange,
  machineSelectDisabled,
  factoryFilter,
  sectionFilter,
  machines,
  factories,
  sections,
}) => (
  <div className="shrink-0 border-b border-border bg-card/50 px-4 py-2.5 flex flex-wrap items-center gap-2 lg:flex-nowrap">
    <WorkOrdersDateFilterControls
      dateViewMode={dateViewMode}
      sheetDate={sheetDate}
      weekPeriodLabel={weekPeriodLabel}
      onDateViewModeChange={onDateViewModeChange}
      onPickDate={onPickDate}
      onPickWeek={onPickWeek}
      orderCountByDate={orderCountByDate}
      calendarMonth={calendarMonth}
      onCalendarMonthChange={onCalendarMonthChange}
    />

    <div className="ml-auto flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
      <WorkOrdersMachineFilter
        machineFilter={machineFilter}
        onMachineChange={onMachineChange}
        disabled={machineSelectDisabled}
        factoryFilter={factoryFilter}
        sectionFilter={sectionFilter}
        machines={machines}
        factories={factories}
        sections={sections}
      />

      <div className="relative min-w-[200px] max-w-md flex-1 sm:w-56 sm:flex-none">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search WO# or description..."
          className={cn('pl-9', appShellHeaderControlClass, 'border-border bg-background')}
        />
      </div>

      <ShowCompleteOrdersSwitchControl
        checked={showCompleteOrders}
        onCheckedChange={onShowCompleteOrdersChange}
        context="sheet"
        ariaLabel="Show completed work orders"
      />

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
    </div>
  </div>
);

export default WorkOrdersToolbar;
