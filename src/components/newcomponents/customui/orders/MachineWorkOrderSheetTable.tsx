import React, { useMemo } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  buildSheetDateGroups,
  buildSheetPeriodLabel,
  getWeekSectionByPosition,
  type SheetDateGroup,
  type SheetWeekSection,
} from '@/pages/newpages/orders/workOrderSheetData';
import type { SheetDateScope } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { WorkOrderSchedule } from '@/types/workOrderSchedule';
import { Loader2 } from 'lucide-react';
import WorkOrderDaySheetPanel from './WorkOrderDaySheetPanel';
import SheetScheduledOrdersList from './SheetScheduledOrdersList';
import WorkOrderSheetTable from './WorkOrderSheetTable';
import { WorkOrderSheetTableHeader } from './workOrderSheetTableParts';

function dayGroupBadgeLabel(group: {
  entryCount: number;
  stagedCount: number;
  isEmpty: boolean;
}): string {
  const parts: string[] = [];
  if (group.isEmpty) {
    parts.push('No orders');
  } else if (group.entryCount === 0) {
    parts.push('No entries');
  } else {
    parts.push(`${group.entryCount} ${group.entryCount === 1 ? 'order' : 'orders'}`);
  }
  if (group.stagedCount > 0) {
    parts.push(`${group.stagedCount} staged`);
  }
  return parts.join(' · ');
}

function SheetDayAccordionItem({
  group,
  selectedDate,
  showStageDay,
  onRowClick,
  onLogEntry,
  onStageDay,
  onConfirmSchedule,
  onCancelSchedule,
  isStagingDay,
  isConfirmingScheduleId,
  isCancellingScheduleId,
  currentUserId,
  onSheetMutated,
}: {
  group: SheetDateGroup;
  selectedDate: string;
  showStageDay?: boolean;
  onRowClick?: (workOrderId: number) => void;
  onLogEntry?: () => void;
  onStageDay?: () => void;
  onConfirmSchedule?: (scheduleId: number) => void;
  onCancelSchedule?: (scheduleId: number) => void;
  isStagingDay?: boolean;
  isConfirmingScheduleId?: number | null;
  isCancellingScheduleId?: number | null;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
}) {
  const stagedSchedules = group.schedulesForDay.filter((s) => s.status === 'STAGED');
  const showSchedulePanel =
    showStageDay === true && (group.isEmpty || stagedSchedules.length > 0);

  return (
    <AccordionItem value={group.date} className="border-b border-border/60">
      <div className="p-0.5">
        <AccordionTrigger
          className={cn(
            'rounded-md px-3 py-1.5 text-sm hover:no-underline',
            group.date === selectedDate
              ? 'border-l-2 border-brand-primary bg-brand-primary/10 font-semibold text-brand-primary'
              : 'border-l-2 border-transparent text-foreground',
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="truncate">{group.label}</span>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px] font-normal',
                group.date === selectedDate && 'border-brand-primary/40 text-brand-primary',
              )}
            >
              {dayGroupBadgeLabel(group)}
            </Badge>
          </span>
        </AccordionTrigger>
      </div>
      <AccordionContent className="pb-0">
        <WorkOrderSheetTable
          rows={group.rows}
          embed
          showHeader={false}
          onRowClick={onRowClick}
          currentUserId={currentUserId}
          onSheetMutated={onSheetMutated}
          tableClassName="min-w-[620px]"
        />
        {showSchedulePanel && (
          <SheetScheduledOrdersList
            schedules={group.isEmpty ? group.schedulesForDay : stagedSchedules}
            onLogEntry={onLogEntry}
            onStageDay={onStageDay}
            onConfirm={onConfirmSchedule}
            onCancel={onCancelSchedule}
            isStaging={isStagingDay}
            isConfirmingId={isConfirmingScheduleId}
            isCancellingId={isCancellingScheduleId}
            showStageDay={showStageDay}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function WorkOrderWeekScanView({
  weekSections,
  onRowClick,
  currentUserId,
  onSheetMutated,
}: {
  weekSections: SheetWeekSection[];
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
}) {
  const anchorSection = getWeekSectionByPosition(weekSections, 'anchor') ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WorkOrderDaySheetPanel
        weekSection={anchorSection}
        onRowClick={onRowClick}
        currentUserId={currentUserId}
        onSheetMutated={onSheetMutated}
      />
    </div>
  );
}

export interface MachineWorkOrderSheetTableProps {
  rows: WorkOrderSheetRow[];
  schedules?: WorkOrderSchedule[];
  dateScope: SheetDateScope;
  sheetDate: string;
  weekSections?: SheetWeekSection[];
  onSheetDateChange?: (iso: string) => void;
  isLoading?: boolean;
  onRowClick?: (workOrderId: number) => void;
  onLogEntry?: () => void;
  onStageDay?: () => void;
  onConfirmSchedule?: (scheduleId: number) => void;
  onCancelSchedule?: (scheduleId: number) => void;
  isStagingDay?: boolean;
  isConfirmingScheduleId?: number | null;
  isCancellingScheduleId?: number | null;
  showStageDay?: boolean;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
}

const MachineWorkOrderSheetTable: React.FC<MachineWorkOrderSheetTableProps> = ({
  rows,
  schedules = [],
  dateScope,
  sheetDate,
  weekSections,
  onSheetDateChange,
  isLoading,
  onRowClick,
  onLogEntry,
  onStageDay,
  onConfirmSchedule,
  onCancelSchedule,
  isStagingDay,
  isConfirmingScheduleId,
  isCancellingScheduleId,
  showStageDay,
  currentUserId,
  onSheetMutated,
}) => {
  const selectedDate = useMemo(
    () => format(startOfDay(parseISO(sheetDate)), 'yyyy-MM-dd'),
    [sheetDate],
  );
  const dateGroups = useMemo(
    () => buildSheetDateGroups(rows, dateScope, selectedDate, schedules),
    [rows, dateScope, selectedDate, schedules],
  );
  const periodLabel = useMemo(
    () => buildSheetPeriodLabel(dateScope, selectedDate),
    [dateScope, selectedDate],
  );

  const handleAccordionChange = (value: string) => {
    if (value && onSheetDateChange) {
      onSheetDateChange(value);
    }
  };

  const dayAccordionProps = {
    selectedDate,
    showStageDay,
    onRowClick,
    onLogEntry,
    onStageDay,
    onConfirmSchedule,
    onCancelSchedule,
    isStagingDay,
    isConfirmingScheduleId,
    isCancellingScheduleId,
    currentUserId,
    onSheetMutated,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading sheet...
        </div>
      </div>
    );
  }

  if (weekSections) {
    return (
      <WorkOrderWeekScanView
        weekSections={weekSections}
        onRowClick={onRowClick}
        currentUserId={currentUserId}
        onSheetMutated={onSheetMutated}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[620px]">
          {periodLabel && (
            <div className="border-b border-border/60 bg-card px-3 py-2 text-sm font-semibold text-foreground">
              {periodLabel}
            </div>
          )}

          <table className="w-full border-collapse text-sm">
            <WorkOrderSheetTableHeader />
          </table>

          <Accordion
            type="single"
            collapsible
            value={selectedDate}
            onValueChange={handleAccordionChange}
            className="w-full"
          >
            {dateGroups.map((group) => (
              <SheetDayAccordionItem key={group.date} group={group} {...dayAccordionProps} />
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default MachineWorkOrderSheetTable;
