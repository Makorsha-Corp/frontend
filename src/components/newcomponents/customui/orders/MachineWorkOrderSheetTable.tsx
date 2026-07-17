import React, { useMemo } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  buildSheetDateGroups,
  buildSheetPeriodLabel,
  sheetRowsHaveParts,
} from '@/pages/newpages/orders/workOrderSheetData';
import type { SheetDateScope } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { WorkOrderSchedule } from '@/types/workOrderSchedule';
import { Bookmark, DollarSign, Loader2 } from 'lucide-react';
import SheetApproverChips from './SheetApproverChips';
import SheetScheduledOrdersList from './SheetScheduledOrdersList';

function priorityBadge(priority: WorkOrderSheetRow['priority']) {
  if (priority === 'HIGH') {
    return (
      <Badge variant="outline" className="border-amber-500/50 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-400">
        HIGH
      </Badge>
    );
  }
  if (priority === 'URGENT') {
    return <Badge variant="destructive" className="px-1 py-0 text-[9px]">URGENT</Badge>;
  }
  if (priority === 'LOW') {
    return (
      <Badge variant="outline" className="px-1 py-0 text-[9px] text-muted-foreground">
        LOW
      </Badge>
    );
  }
  return null;
}

function SheetRowIndicators({ row }: { row: WorkOrderSheetRow }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1">
      {priorityBadge(row.priority)}
      {row.hasBilling && (
        <span title={row.billingHint ?? 'Billing'} className="inline-flex text-muted-foreground">
          <DollarSign className="h-3 w-3" />
        </span>
      )}
      {row.hasTemplate && (
        <span title="From template" className="inline-flex text-muted-foreground">
          <Bookmark className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

function SheetTableHeader({ showPartColumns }: { showPartColumns: boolean }) {
  return (
    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
      <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <th className="px-2 py-1.5">Machine</th>
        <th className="px-2 py-1.5">Works</th>
        <th className="px-2 py-1.5">Parts / consumables</th>
        {showPartColumns && <th className="px-2 py-1.5 text-right">Qty</th>}
        {showPartColumns && <th className="px-2 py-1.5">Unit</th>}
        <th className="px-2 py-1.5">Workers</th>
        <th className="px-2 py-1.5">Approvers</th>
        <th className="px-2 py-1.5">Remarks</th>
      </tr>
    </thead>
  );
}

function SheetDayRows({
  rows,
  showPartColumns,
  onRowClick,
}: {
  rows: WorkOrderSheetRow[];
  showPartColumns: boolean;
  onRowClick?: (workOrderId: number) => void;
}) {
  return (
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr
          key={row.key}
          title={row.rowTitle ?? undefined}
          className={cn(
            'border-b border-border/40 hover:bg-muted/30',
            onRowClick && 'cursor-pointer',
            !row.isFirstInGroup && rowIndex % 2 === 1 && 'bg-muted/10',
          )}
          onClick={() => onRowClick?.(row.workOrderId)}
        >
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={row.groupRowSpan}
                className="border-r border-border/40 px-2 py-1.5 align-top text-sm font-medium text-card-foreground"
              >
                {row.machineName}
              </td>
              <td
                rowSpan={row.groupRowSpan}
                className="border-r border-border/40 px-2 py-1.5 align-top text-sm text-muted-foreground"
              >
                <div>{row.works}</div>
                <SheetRowIndicators row={row} />
              </td>
            </>
          ) : null}
          <td className="px-2 py-1.5 text-sm">{row.partName}</td>
          {showPartColumns && (
            <td className="px-2 py-1.5 text-right text-sm tabular-nums">
              {row.quantity != null ? row.quantity : '—'}
            </td>
          )}
          {showPartColumns && (
            <td className="px-2 py-1.5 text-sm text-muted-foreground">{row.unit}</td>
          )}
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={row.groupRowSpan}
                className="border-l border-border/40 px-2 py-1.5 align-top text-sm text-muted-foreground"
              >
                {row.workers}
              </td>
              <td rowSpan={row.groupRowSpan} className="px-2 py-1.5 align-top">
                <SheetApproverChips approvers={row.approvers} />
              </td>
              <td
                rowSpan={row.groupRowSpan}
                className="max-w-[10rem] truncate px-2 py-1.5 align-top text-xs text-muted-foreground"
                title={row.remarks}
              >
                {row.remarks}
                {row.billingHint && (
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground/80">
                    {row.billingHint}
                  </span>
                )}
              </td>
            </>
          ) : null}
        </tr>
      ))}
    </tbody>
  );
}

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

export interface MachineWorkOrderSheetTableProps {
  rows: WorkOrderSheetRow[];
  schedules?: WorkOrderSchedule[];
  dateScope: SheetDateScope;
  sheetDate: string;
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
}

const MachineWorkOrderSheetTable: React.FC<MachineWorkOrderSheetTableProps> = ({
  rows,
  schedules = [],
  dateScope,
  sheetDate,
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
  const showPartColumns = sheetRowsHaveParts(rows);

  const handleAccordionChange = (value: string) => {
    if (value && onSheetDateChange) {
      onSheetDateChange(value);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading sheet...
          </div>
        ) : (
          <div className="min-w-[680px]">
            {periodLabel && (
              <div className="border-b border-border/60 bg-card px-3 py-2 text-sm font-semibold text-foreground">
                {periodLabel}
              </div>
            )}

            <table className="w-full border-collapse text-sm">
              <SheetTableHeader showPartColumns={showPartColumns} />
            </table>

            <Accordion
              type="single"
              collapsible
              value={selectedDate}
              onValueChange={handleAccordionChange}
              className="w-full"
            >
              {dateGroups.map((group) => {
                const stagedSchedules = group.schedulesForDay.filter((s) => s.status === 'STAGED');
                const showSchedulePanel = group.isEmpty || stagedSchedules.length > 0;
                return (
                  <AccordionItem key={group.date} value={group.date} className="border-b border-border/60">
                    <div className="p-0.5">
                      <AccordionTrigger
                        className={cn(
                          'rounded-md px-3 py-1.5 text-sm hover:no-underline',
                          group.isSelected
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
                              group.isSelected && 'border-brand-primary/40 text-brand-primary',
                            )}
                          >
                            {dayGroupBadgeLabel(group)}
                          </Badge>
                        </span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="pb-0">
                      {group.rows.length > 0 && (
                        <table className="w-full min-w-[680px] border-collapse text-sm">
                          <SheetDayRows
                            rows={group.rows}
                            showPartColumns={showPartColumns}
                            onRowClick={onRowClick}
                          />
                        </table>
                      )}
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
              })}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineWorkOrderSheetTable;
