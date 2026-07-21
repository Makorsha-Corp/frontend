import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import WorkOrderWeekNavigator from '@/components/newcomponents/customui/orders/WorkOrderWeekNavigator';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import type { WorkOrdersLayoutMode, WorkOrdersWeekView } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';

const toolbarTabsListClass = 'h-9 shrink-0 gap-0.5 bg-muted/80 p-1 ring-1 ring-border/60';
const toolbarTabsTriggerClass =
  'px-3 py-1.5 text-sm font-semibold data-[state=active]:shadow-sm';

export interface WorkOrdersToolbarWeekNav {
  sheetDate: string;
  calendarSheetRows: WorkOrderSheetRow[];
  orderCountByDate: Record<string, number>;
  calendarMonth: Date;
  onCalendarMonthChange: (month: Date) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onSheetDateChange: (iso: string) => void;
  onGoToToday: () => void;
}

export interface WorkOrdersToolbarProps {
  layoutMode: WorkOrdersLayoutMode;
  onLayoutModeChange: (mode: WorkOrdersLayoutMode) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtersPanelOpen: boolean;
  onFiltersPanelOpenChange: (open: boolean) => void;
  activeFilterCount: number;
  weekNav?: WorkOrdersToolbarWeekNav;
  weekView?: WorkOrdersWeekView;
  onWeekViewChange?: (view: WorkOrdersWeekView) => void;
  machineFilter: string;
  onMachineChange: (value: string) => void;
  machines: Machine[];
  machineSelectDisabled?: boolean;
}

const WorkOrdersToolbar: React.FC<WorkOrdersToolbarProps> = ({
  layoutMode,
  onLayoutModeChange,
  searchQuery,
  onSearchChange,
  filtersPanelOpen,
  onFiltersPanelOpenChange,
  activeFilterCount,
  weekNav,
  weekView = 'rows',
  onWeekViewChange,
  machineFilter,
  onMachineChange,
  machines,
  machineSelectDisabled = false,
}) => (
  <div className="shrink-0 border-b border-border bg-card/50 px-4 py-2.5 flex flex-wrap items-center gap-2 lg:flex-nowrap">
    <Tabs
      value={layoutMode}
      onValueChange={(value) => onLayoutModeChange(value as WorkOrdersLayoutMode)}
    >
      <TabsList className={toolbarTabsListClass}>
        <TabsTrigger value="list" className={toolbarTabsTriggerClass}>
          List
        </TabsTrigger>
        <TabsTrigger value="week" className={toolbarTabsTriggerClass}>
          Calendar week
        </TabsTrigger>
      </TabsList>
    </Tabs>

    {layoutMode === 'week' && onWeekViewChange ? (
      <Tabs
        value={weekView}
        onValueChange={(value) => onWeekViewChange(value as WorkOrdersWeekView)}
      >
        <TabsList className={toolbarTabsListClass}>
          <TabsTrigger value="rows" className={toolbarTabsTriggerClass}>
            Rows
          </TabsTrigger>
          <TabsTrigger value="columns" className={toolbarTabsTriggerClass}>
            Columns
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ) : null}

    <div className="flex min-w-0 flex-1 justify-center">
      {weekNav ? (
        <WorkOrderWeekNavigator
          sheetDate={weekNav.sheetDate}
          calendarSheetRows={weekNav.calendarSheetRows}
          orderCountByDate={weekNav.orderCountByDate}
          calendarMonth={weekNav.calendarMonth}
          onCalendarMonthChange={weekNav.onCalendarMonthChange}
          onNavigatePrev={weekNav.onNavigatePrev}
          onNavigateNext={weekNav.onNavigateNext}
          onSheetDateChange={weekNav.onSheetDateChange}
          onGoToToday={weekNav.onGoToToday}
        />
      ) : null}
    </div>

    <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2 lg:flex-nowrap">
      <Select value={machineFilter} onValueChange={onMachineChange} disabled={machineSelectDisabled}>
        <SelectTrigger
          className={cn(
            'h-9 w-[min(180px,40vw)] border-border bg-background text-sm',
            appShellHeaderControlClass,
          )}
        >
          <SelectValue placeholder="Machine" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All machines</SelectItem>
          {machines.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative min-w-[200px] max-w-md flex-1 sm:w-56 sm:flex-none">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search WO# or title..."
          className={cn('pl-9', appShellHeaderControlClass, 'border-border bg-background')}
        />
      </div>

      <Button
        type="button"
        variant={filtersPanelOpen ? 'secondary' : 'outline'}
        size="sm"
        className={cn('shrink-0 gap-1.5', appShellHeaderControlClass)}
        onClick={() => onFiltersPanelOpenChange(!filtersPanelOpen)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    </div>
  </div>
);

export default WorkOrdersToolbar;
