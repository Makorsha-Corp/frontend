import React from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  formatWorkOrderDatePopoverLines,
  getWorkOrderSheetDisplayDate,
  hasWorkOrderLifecycleVariance,
  type WorkOrderLifecycleNote,
} from '@/pages/newpages/orders/workOrderDateUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  workOrderItemActionLabel,
  workOrderPriorityBadgeClass,
  workOrderPriorityBadgeLabel,
  workOrderStatusBadgeClass,
  workOrderStatusLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { Bookmark, Clock, DollarSign } from 'lucide-react';
import SheetApproverChips from './SheetApproverChips';
import SheetWorkOrderRowActions from './SheetWorkOrderRowActions';
import { initialsOf } from './transferOrderApprovals';
import {
  SHEET_ACTIONS_COL,
  SHEET_APPROVERS_COL,
  SHEET_BADGE,
  SHEET_CELL_PAD,
  SHEET_CHIP,
  SHEET_DATE_COL,
  SHEET_HEADER,
  SHEET_HEADER_CELL_PAD,
  SHEET_META,
  SHEET_PRIMARY,
  SHEET_WORKERS_COL,
  SHEET_WORKS_COL,
} from './workOrderSheetTypography';

function priorityBadge(priority: WorkOrderSheetRow['priority']) {
  return (
    <Badge
      variant="outline"
      className={cn(
        SHEET_BADGE,
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
        className={cn(SHEET_BADGE, 'border-sky-500/40 font-normal text-sky-700 dark:text-sky-400')}
      >
        Planned
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(SHEET_BADGE, 'font-normal', workOrderStatusBadgeClass(row.status))}
    >
      {workOrderStatusLabel(row.status)}
    </Badge>
  );
}

function approvalPendingBadge(row: WorkOrderSheetRow) {
  if (row.approvalMet || row.approvers.length === 0 || row.status !== 'DRAFT') return null;
  return (
    <Badge variant="outline" className={cn(SHEET_BADGE, 'border-amber-500/40 text-amber-700 dark:text-amber-400')}>
      Needs approval
    </Badge>
  );
}

function SheetEmptyCell({ children }: { children: React.ReactNode }) {
  return <span className={cn(SHEET_META, 'italic')}>{children}</span>;
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
  const hasParts = row.partName !== '—';
  const partCountLabel = hasParts
    ? `${row.groupRowSpan} part${row.groupRowSpan === 1 ? '' : 's'}`
    : null;
  const locationLabel = row.sectionName ? `${row.factoryName} · ${row.sectionName}` : row.factoryName;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className={cn(SHEET_PRIMARY, 'leading-snug')}>{row.machineName}</span>
        {priorityBadge(row.priority)}
        {statusBadge(row)}
        {approvalPendingBadge(row)}
      </div>

      <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-normal', SHEET_META)}>
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
    </div>
  );
}

function SheetWorksCell({ works }: { works: string }) {
  return (
    <div className={cn('min-w-0 leading-snug', SHEET_PRIMARY)}>{works}</div>
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
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {initialsOf(name)}
          </span>
          <span className={cn('truncate leading-tight', SHEET_PRIMARY)}>{name}</span>
        </div>
      ))}
    </div>
  );
}

const SHEET_PARTS_SCROLL_MIN = 3;
/** ~2 compact part lines visible before vertical scroll */
const SHEET_PARTS_SCROLL_MAX_H = 'max-h-12';

function SheetPartLine({ row }: { row: WorkOrderSheetRow }) {
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

  const metaParts = [actionLabel, qtyLabel].filter(Boolean);
  const metaText = metaParts.join(' · ');

  return (
    <div className="min-w-0 overflow-x-auto overflow-y-hidden">
      <div className="flex w-max max-w-none items-center gap-x-1.5 whitespace-nowrap">
        <span className={cn('shrink-0', SHEET_PRIMARY)}>{row.partName}</span>
        {metaText ? (
          <>
            <span className="h-3 w-px shrink-0 bg-border" aria-hidden />
            <span className={cn('shrink-0', SHEET_CHIP)}>{metaText}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SheetPartCell({ row }: { row: WorkOrderSheetRow }) {
  return <SheetPartLine row={row} />;
}

function SheetPartsGroupCell({ rows }: { rows: WorkOrderSheetRow[] }) {
  const scrollable = rows.length >= SHEET_PARTS_SCROLL_MIN;

  return (
    <div
      className={cn(
        'min-w-0 flex flex-col gap-1',
        scrollable && cn(SHEET_PARTS_SCROLL_MAX_H, 'overflow-y-auto overflow-x-hidden'),
      )}
    >
      {rows.map((partRow) => (
        <SheetPartLine key={partRow.key} row={partRow} />
      ))}
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
      <tr className={cn('border-b border-border/60 text-left', SHEET_HEADER)}>
        {showStartDateColumn ? (
          <th className={cn(SHEET_DATE_COL, SHEET_HEADER_CELL_PAD)}>Date</th>
        ) : null}
        <th className={SHEET_HEADER_CELL_PAD}>Machine</th>
        <th className={cn(SHEET_WORKS_COL, SHEET_HEADER_CELL_PAD)}>Works</th>
        <th className={SHEET_HEADER_CELL_PAD}>Parts / consumables</th>
        <th className={cn(SHEET_WORKERS_COL, SHEET_HEADER_CELL_PAD)}>Workers</th>
        <th className={cn(SHEET_APPROVERS_COL, SHEET_HEADER_CELL_PAD)}>Approvers</th>
        <th className={cn(SHEET_ACTIONS_COL, SHEET_HEADER_CELL_PAD)}>Actions</th>
      </tr>
    </thead>
  );
}

function lifecycleNoteToneClass(note: WorkOrderLifecycleNote) {
  if (note.text.includes(' late')) {
    return 'text-amber-700 dark:text-amber-400';
  }
  if (note.tone === 'completed') {
    return 'text-blue-700 dark:text-blue-400';
  }
  return 'text-emerald-700 dark:text-emerald-400';
}

function lifecycleVarianceIconClass(notes: WorkOrderLifecycleNote[]): string {
  const isLate = notes.some((note) => note.text.includes(' late'));
  if (isLate) return 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300';
  return 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300';
}

function SheetStartDateCell({ row }: { row: WorkOrderSheetRow }) {
  const dateRow = {
    plannedDate: row.plannedDate,
    calendarDate: row.date,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
  const displayDate = getWorkOrderSheetDisplayDate(dateRow);
  const hasVariance = hasWorkOrderLifecycleVariance(dateRow);
  const popoverLines = hasVariance ? formatWorkOrderDatePopoverLines(dateRow) : null;

  return (
    <div className={cn(SHEET_DATE_COL, 'flex items-center gap-0.5')}>
      <span className={SHEET_PRIMARY}>{displayDate}</span>
      {hasVariance && popoverLines ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex shrink-0 rounded p-0.5 transition-colors',
                lifecycleVarianceIconClass(popoverLines.lifecycleNotes),
              )}
              aria-label="View start timeline"
              onClick={(event) => event.stopPropagation()}
            >
              <Clock className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 space-y-2 p-3"
            align="start"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <div className={cn(SHEET_HEADER, 'normal-case tracking-normal')}>Planned</div>
              <div className={cn('mt-0.5', SHEET_PRIMARY)}>{popoverLines.plannedLabel}</div>
            </div>
            {popoverLines.lifecycleNotes.map((note) => (
              <div
                key={note.text}
                className={cn('text-sm leading-snug', lifecycleNoteToneClass(note))}
              >
                {note.text}
              </div>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
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
      {rows.map((row, rowIndex) => {
        if (row.groupRowSpan >= SHEET_PARTS_SCROLL_MIN && !row.isFirstInGroup) {
          return null;
        }

        const partGroupRows =
          row.groupRowSpan >= SHEET_PARTS_SCROLL_MIN
            ? rows.slice(rowIndex, rowIndex + row.groupRowSpan)
            : [row];
        const effectiveRowSpan =
          row.groupRowSpan >= SHEET_PARTS_SCROLL_MIN ? 1 : row.groupRowSpan;

        return (
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
              rowSpan={effectiveRowSpan}
              className={cn(
                SHEET_DATE_COL,
                'border-r border-border/40 align-top text-card-foreground',
                SHEET_CELL_PAD,
              )}
            >
              <SheetStartDateCell row={row} />
            </td>
          ) : null}
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn('border-r border-border/40 align-top text-card-foreground', SHEET_CELL_PAD)}
              >
                <SheetMachineCell row={row} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_WORKS_COL, 'border-r border-border/40 align-middle text-card-foreground', SHEET_CELL_PAD)}
              >
                <SheetWorksCell works={row.works} />
              </td>
            </>
          ) : null}
          <td className={cn('align-middle text-card-foreground', SHEET_CELL_PAD)}>
            {partGroupRows.length >= SHEET_PARTS_SCROLL_MIN ? (
              <SheetPartsGroupCell rows={partGroupRows} />
            ) : (
              <SheetPartCell row={row} />
            )}
          </td>
          {row.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_WORKERS_COL, 'border-l border-border/40 align-middle', SHEET_CELL_PAD)}
              >
                <SheetWorkersCell workers={row.workers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_APPROVERS_COL, 'align-middle', SHEET_CELL_PAD)}
              >
                <SheetApproverChips approvers={row.approvers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_ACTIONS_COL, 'align-middle', SHEET_CELL_PAD)}
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
        );
      })}
    </tbody>
  );
}
