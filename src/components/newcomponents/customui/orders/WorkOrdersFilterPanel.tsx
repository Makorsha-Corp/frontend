import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUS_OPTIONS,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import type {
  WorkOrderPriorityFilter,
  WorkOrderStatusFilter,
  WorkTypeFilter,
} from '@/pages/newpages/orders/workOrdersOverviewData';
import {
  buildWorkOrderPanelFilterChips,
  type WorkOrderFilterChipHandlers,
} from '@/pages/newpages/orders/workOrdersFilterUtils';
import type { WorkOrdersFilterState } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { cn } from '@/lib/utils';

export interface WorkOrdersFilterPanelProps {
  filters: WorkOrdersFilterState;
  statusFilter: WorkOrderStatusFilter;
  workTypeFilter: WorkTypeFilter;
  priorityFilter: WorkOrderPriorityFilter;
  onStatusChange: (v: WorkOrderStatusFilter) => void;
  onWorkTypeChange: (v: WorkTypeFilter) => void;
  onPriorityChange: (v: WorkOrderPriorityFilter) => void;
  onClearPanelFilters: () => void;
  chipHandlers: WorkOrderFilterChipHandlers;
  factories: Factory[];
  sections: FactorySection[];
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  className?: string;
}

const selectTriggerClass = 'h-9 w-full border-border bg-background text-sm';

const WorkOrdersFilterPanel: React.FC<WorkOrdersFilterPanelProps> = ({
  filters,
  statusFilter,
  workTypeFilter,
  priorityFilter,
  onStatusChange,
  onWorkTypeChange,
  onPriorityChange,
  onClearPanelFilters,
  chipHandlers,
  factories,
  sections,
  machines,
  workOrderTypes,
  className,
}) => {
  const chips = useMemo(
    () =>
      buildWorkOrderPanelFilterChips(
        filters,
        factories,
        sections,
        machines,
        workOrderTypes,
        chipHandlers,
      ),
    [filters, factories, sections, machines, workOrderTypes, chipHandlers],
  );

  return (
    <div className={cn('flex flex-col gap-2.5 p-3', className)}>
      <div className="grid gap-2">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as WorkOrderStatusFilter)}>
          <SelectTrigger className={cn(selectTriggerClass, appShellHeaderControlClass)}>
            <SelectValue placeholder="All statuses" />
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
          <SelectTrigger className={cn(selectTriggerClass, appShellHeaderControlClass)}>
            <SelectValue placeholder="All types" />
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

        <Select
          value={priorityFilter}
          onValueChange={(v) => onPriorityChange(v as WorkOrderPriorityFilter)}
        >
          <SelectTrigger className={cn(selectTriggerClass, appShellHeaderControlClass)}>
            <SelectValue placeholder="All priorities" />
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
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {chips.map(({ chip, onRemove }) => (
            <Badge key={chip.id} variant="secondary" className="gap-1 pr-1 font-normal">
              {chip.label}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={onRemove}
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onClearPanelFilters}>
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default WorkOrdersFilterPanel;
