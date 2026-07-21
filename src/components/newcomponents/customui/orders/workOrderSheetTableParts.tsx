import React from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  workOrderItemActionLabel,
  workOrderPriorityBadgeClass,
  workOrderPriorityBadgeLabel,
  workOrderStatusBadgeClass,
  workOrderStatusLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { parseApiDateTime } from '@/utils/datetime';
import { Bookmark, DollarSign } from 'lucide-react';
import SheetApproverChips from './SheetApproverChips';
import SheetWorkOrderRowActions from './SheetWorkOrderRowActions';
import { initialsOf } from './transferOrderApprovals';

function formatSheetTimestamp(iso: string | null): string | null {
  if (!iso) return null;
  const date = parseApiDateTime(iso);
  if (!date || Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM d, HH:mm');
}

function priorityBadge(priority: WorkOrderSheetRow['priority']) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'px-1 py-0 text-[9px] font-semibold',
        workOrderPriorityBadgeClass(priority),
      )}
    >
      {workOrderPriorityBadgeLabel(priority)}
    </Badge>
  );
}

function isFuturePlannedRow(row: WorkOrderSheetRow): boolean {
  if (row.status !== 'DRAFT') return false;
  try {
    return startOfDay(parseISO(row.date)) > startOfDay(new Date());
  } catch {
    return false;
  }
}

function statusBadge(row: WorkOrderSheetRow) {
  if (isFuturePlannedRow(row)) {
    return (
      <Badge
        variant="outline"
        className="border-sky-500/40 px-1 py-0 text-[9px] font-normal text-sky-700 dark:text-sky-400"
      >
        Planned
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn('px-1 py-0 text-[9px] font-normal', workOrderStatusBadgeClass(row.status))}
    >
      {workOrderStatusLabel(row.status)}
    </Badge>
  );
}

function approvalPendingBadge(row: WorkOrderSheetRow) {
  if (row.approvalMet || row.approvers.length === 0 || row.status !== 'DRAFT') return null;
  return (
    <Badge variant="outline" className="border-amber-500/40 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-400">
      Needs approval
    </Badge>
  );
}

function SheetEmptyCell({ children }: { children: React.ReactNode }) {
  return <span className="text-xs italic text-muted-foreground/80">{children}</span>;
}

function SheetRowIndicators({ row }: { row: WorkOrderSheetRow }) {
  if (!row.hasBilling && !row.hasTemplate) return null;
  return (
    <>
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
    </>
  );
}

function SheetMachineCell({ row }: { row: WorkOrderSheetRow }) {
  const started = formatSheetTimestamp(row.startedAt);
  const completed = formatSheetTimestamp(row.completedAt);
  const hasParts = row.partName !== '—';
  const partCountLabel = hasParts
    ? `${row.groupRowSpan} part${row.groupRowSpan === 1 ? '' : 's'}`
    : null;
  const locationLabel = row.sectionName ? `${row.factoryName} · ${row.sectionName}` : row.factoryName;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="text-sm font-semibold leading-snug">{row.machineName}</span>
        {priorityBadge(row.priority)}
        {statusBadge(row)}
        {approvalPendingBadge(row)}
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-normal text-muted-foreground">
        <span>{row.workOrderNumber}</span>
        <span aria-hidden className="text-border">·</span>
        <span>{locationLabel}</span>
        {partCountLabel ? (
          <>
            <span aria-hidden className="text-border">·</span>
            <span>{partCountLabel}</span>
          </>
        ) : null}
        <SheetRowIndicators row={row} />
      </div>

      {(started || completed) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] leading-normal">
          {started ? (
            <span className="text-emerald-700 dark:text-emerald-400">Started {started}</span>
          ) : null}
          {completed ? (
            <span className="text-blue-700 dark:text-blue-400">Done {completed}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SheetWorksCell({ works }: { works: string }) {
  return (
    <div className="min-w-0 text-sm font-medium leading-snug text-foreground/90">{works}</div>
  );
}

function parseWorkerNames(workers: string): string[] {
  if (!workers || workers === '—') return [];
  return workers
    .split(/[,;]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function SheetWorkersCell({ workers }: { workers: string }) {
  const names = parseWorkerNames(workers);
  if (names.length === 0) {
    return <SheetEmptyCell>No workers</SheetEmptyCell>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {names.map((name) => (
        <div key={name} className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
            {initialsOf(name)}
          </span>
          <span className="truncate text-xs leading-tight text-card-foreground">{name}</span>
        </div>
      ))}
    </div>
  );
}

function SheetPartCell({ row }: { row: WorkOrderSheetRow }) {
  if (row.partName === '—') {
    return <SheetEmptyCell>No parts required</SheetEmptyCell>;
  }

  const actionLabel = row.actionType ? workOrderItemActionLabel(row.actionType) : null;
  const qtyLabel =
    row.quantity != null && row.unit !== '—'
      ? `${row.quantity} ${row.unit}`
      : row.quantity != null
        ? String(row.quantity)
        : null;

  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-card-foreground">{row.partName}</div>
      {(actionLabel || qtyLabel) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[10px] text-muted-foreground">
          {actionLabel ? <span>{actionLabel}</span> : null}
          {actionLabel && qtyLabel ? <span aria-hidden>·</span> : null}
          {qtyLabel ? <span>{qtyLabel}</span> : null}
        </div>
      )}
    </div>
  );
}

export function WorkOrderSheetTableHeader({
  showStartDateColumn = false,
}: {
  showStartDateColumn?: boolean;
}) {
  return (
    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
      <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {showStartDateColumn ? (
          <th className="w-[4.5rem] min-w-[4.5rem] px-2 py-1.5">Start</th>
        ) : null}
        <th className="px-2 py-1.5">Machine</th>
        <th className="w-[8rem] min-w-[8rem] px-2 py-1.5">Works</th>
        <th className="px-2 py-1.5">Parts / consumables</th>
        <th className="w-[7.5rem] min-w-[7.5rem] px-2 py-1.5">Workers</th>
        <th className="w-[8.5rem] min-w-[8.5rem] px-2 py-1.5">Approvers</th>
        <th className="w-[7.5rem] min-w-[7.5rem] px-2 py-1.5">Actions</th>
      </tr>
    </thead>
  );
}

function formatSheetStartDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export interface WorkOrderSheetDayRowsProps {
  rows: WorkOrderSheetRow[];
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
  showStartDateColumn?: boolean;
}

export function WorkOrderSheetDayRows({
  rows,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
  showStartDateColumn = false,
}: WorkOrderSheetDayRowsProps) {
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
          {showStartDateColumn && row.isFirstInGroup ? (
            <td
              rowSpan={row.groupRowSpan}
              className="w-[4.5rem] min-w-[4.5rem] border-r border-border/40 px-2 py-1.5 align-top text-[11px] text-muted-foreground"
            >
              {formatSheetStartDate(row.date)}
            </td>
          ) : null}
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={row.groupRowSpan}
                className="border-r border-border/40 px-2 py-2.5 align-top text-sm text-card-foreground"
              >
                <SheetMachineCell row={row} />
              </td>
              <td
                rowSpan={row.groupRowSpan}
                className="w-[8rem] min-w-[8rem] border-r border-border/40 px-2 py-2.5 align-middle text-sm text-card-foreground"
              >
                <SheetWorksCell works={row.works} />
              </td>
            </>
          ) : null}
          <td className="px-2 py-1.5 align-middle text-sm">
            <SheetPartCell row={row} />
          </td>
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={row.groupRowSpan}
                className="w-[7.5rem] min-w-[7.5rem] border-l border-border/40 px-2 py-1.5 align-middle"
              >
                <SheetWorkersCell workers={row.workers} />
              </td>
              <td
                rowSpan={row.groupRowSpan}
                className="w-[8.5rem] min-w-[8.5rem] px-2 py-1.5 align-middle"
              >
                <SheetApproverChips approvers={row.approvers} />
              </td>
              <td
                rowSpan={row.groupRowSpan}
                className="w-[7.5rem] min-w-[7.5rem] px-2 py-1.5 align-middle"
              >
                <SheetWorkOrderRowActions
                  workOrderId={row.workOrderId}
                  workOrderNumber={row.workOrderNumber}
                  status={row.status}
                  approvalMet={row.approvalMet}
                  machineId={row.machineId}
                  approvers={row.approvers}
                  currentUserId={currentUserId}
                  onOpenDetail={() => onRowClick?.(row.workOrderId)}
                  onMutated={onSheetMutated}
                />
              </td>
            </>
          ) : null}
        </tr>
      ))}
    </tbody>
  );
}
