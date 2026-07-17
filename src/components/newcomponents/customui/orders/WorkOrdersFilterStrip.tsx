import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUS_OPTIONS,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import type { SheetDateScope, SheetRowFlow } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type {
  WorkOrderPriorityFilter,
  WorkOrderStatusFilter,
  WorkTypeFilter,
} from '@/pages/newpages/orders/workOrdersOverviewData';
import { cn } from '@/lib/utils';

export interface WorkOrdersFilterStripProps {
  showHubFilters?: boolean;
  dateScope: SheetDateScope;
  sheetDate: string;
  onDateScopeChange: (scope: SheetDateScope) => void;
  onSheetDateChange: (iso: string) => void;
  statusFilter: WorkOrderStatusFilter;
  workTypeFilter: WorkTypeFilter;
  priorityFilter: WorkOrderPriorityFilter;
  factoryFilter: string;
  sectionFilter: string;
  machineFilter: string;
  searchQuery: string;
  onStatusChange: (v: WorkOrderStatusFilter) => void;
  onWorkTypeChange: (v: WorkTypeFilter) => void;
  onPriorityChange: (v: WorkOrderPriorityFilter) => void;
  onFactoryChange: (v: string) => void;
  onSectionChange: (v: string) => void;
  onMachineChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  factories: Factory[];
  sections: FactorySection[];
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  className?: string;
  /** Sheet-only: primary log entry action */
  showLogEntry?: boolean;
  logEntryDisabled?: boolean;
  onLogEntry?: () => void;
  /** Sheet-only: row interaction flow switcher */
  sheetRowFlow?: SheetRowFlow;
  onSheetRowFlowChange?: (flow: SheetRowFlow) => void;
}

const WorkOrdersFilterStrip: React.FC<WorkOrdersFilterStripProps> = ({
  showHubFilters = true,
  dateScope,
  sheetDate,
  onDateScopeChange,
  onSheetDateChange,
  statusFilter,
  workTypeFilter,
  priorityFilter,
  factoryFilter,
  sectionFilter,
  machineFilter,
  searchQuery,
  onStatusChange,
  onWorkTypeChange,
  onPriorityChange,
  onFactoryChange,
  onSectionChange,
  onMachineChange,
  onSearchChange,
  factories,
  sections,
  machines,
  workOrderTypes,
  className,
  showLogEntry,
  logEntryDisabled,
  onLogEntry,
  sheetRowFlow,
  onSheetRowFlowChange,
}) => {
  const sectionsForFactory =
    factoryFilter === 'all'
      ? sections
      : sections.filter((s) => s.factory_id === Number(factoryFilter));

  const machinesForScope = machines.filter((m) => {
    if (sectionFilter !== 'all' && m.factory_section_id !== Number(sectionFilter)) return false;
    if (factoryFilter !== 'all') {
      const sec = sections.find((s) => s.id === m.factory_section_id);
      return sec?.factory_id === Number(factoryFilter);
    }
    return true;
  });

  const parsedDate = sheetDate ? new Date(`${sheetDate}T12:00:00`) : new Date();

  return (
    <div className={cn('shrink-0 border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-2', className)}>
      <Select value={dateScope} onValueChange={(v) => onDateScopeChange(v as SheetDateScope)}>
        <SelectTrigger className="w-[100px] h-9 border-border bg-background text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('min-w-[160px] justify-start border-border bg-background', appShellHeaderControlClass)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(parsedDate, 'dd.MM.yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={(d) => d && onSheetDateChange(format(d, 'yyyy-MM-dd'))}
          />
        </PopoverContent>
      </Popover>

      <Select value={factoryFilter} onValueChange={onFactoryChange}>
        <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
          <SelectValue placeholder="Factory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All factories</SelectItem>
          {factories.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sectionFilter} onValueChange={onSectionChange}>
        <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sections</SelectItem>
          {sectionsForFactory.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={machineFilter} onValueChange={onMachineChange}>
        <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
          <SelectValue placeholder="Machine" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All machines</SelectItem>
          {machinesForScope.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showHubFilters && (
        <>
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as WorkOrderStatusFilter)}>
            <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {WORK_ORDER_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={workTypeFilter === 'all' ? 'all' : String(workTypeFilter)}
            onValueChange={(v) => onWorkTypeChange(v === 'all' ? 'all' : Number(v))}
          >
            <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {workOrderTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => onPriorityChange(v as WorkOrderPriorityFilter)}>
            <SelectTrigger className="w-[120px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {WORK_ORDER_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {priorityLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search WO# or title..."
            className="w-[180px] h-9 border-border bg-background text-sm"
          />
        </>
      )}

      {showLogEntry && (
        <>
          {onSheetRowFlowChange && sheetRowFlow && (
            <Select value={sheetRowFlow} onValueChange={(v) => onSheetRowFlowChange(v as SheetRowFlow)}>
              <SelectTrigger className="h-9 w-[130px] border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modal-edit">Modal edit</SelectItem>
                <SelectItem value="side-panel">Side panel</SelectItem>
                <SelectItem value="preview">Preview</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            size="sm"
            className="h-9 bg-brand-primary hover:bg-brand-primary-hover"
            disabled={logEntryDisabled}
            onClick={onLogEntry}
          >
            <Plus className="mr-1 h-4 w-4" />
            Log entry
          </Button>
        </>
      )}
    </div>
  );
};

export default WorkOrdersFilterStrip;
