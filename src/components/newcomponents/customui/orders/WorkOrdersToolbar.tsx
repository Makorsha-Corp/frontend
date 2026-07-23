import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import WorkOrdersDateFilterControls from '@/components/newcomponents/customui/orders/WorkOrdersDateFilterControls';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
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
  machineFilter: string;
  onMachineChange: (value: string) => void;
  machines: Machine[];
  machineSelectDisabled?: boolean;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
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
  machineFilter,
  onMachineChange,
  machines,
  machineSelectDisabled = false,
  showCompleteOrders,
  onShowCompleteOrdersChange,
}) => (
  <div className="shrink-0 border-b border-border bg-card/50 px-4 py-2.5 flex flex-wrap items-center gap-2 lg:flex-nowrap">
    <WorkOrdersDateFilterControls
      dateViewMode={dateViewMode}
      sheetDate={sheetDate}
      weekPeriodLabel={weekPeriodLabel}
      onDateViewModeChange={onDateViewModeChange}
      onPickDate={onPickDate}
      onPickWeek={onPickWeek}
    />

    <div className="ml-auto flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
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
          placeholder="Search WO# or description..."
          className={cn('pl-9', appShellHeaderControlClass, 'border-border bg-background')}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Switch
          id="wo-show-complete-toolbar"
          checked={showCompleteOrders}
          onCheckedChange={onShowCompleteOrdersChange}
          aria-label="Show complete work orders"
        />
        <Label
          htmlFor="wo-show-complete-toolbar"
          className="cursor-pointer whitespace-nowrap text-sm font-normal text-muted-foreground"
        >
          Show complete
        </Label>
      </div>

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
