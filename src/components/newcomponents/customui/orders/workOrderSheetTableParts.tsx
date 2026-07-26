import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import { getSheetDateStatusSublabel } from '@/pages/newpages/orders/workOrderSheetData';
import {
  getWorkOrderSheetDateAttention,
  getWorkOrderSheetDisplayDate,
  type WorkOrderLifecycleNote,
  type WorkOrderSheetAttentionKind,
} from '@/pages/newpages/orders/workOrderDateUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  workOrderItemActionLabel,
  workOrderPriorityBadgeClass,
  workOrderPriorityBadgeLabel,
  workOrderStatusBadgeClass,
  workOrderStatusLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { DollarSign, Repeat2 } from 'lucide-react';
import {
  formatRecurrenceProgramDateLabel,
  RECURRENCE_PROGRAM_POPOVER_MAX_DATES,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import RecurringProgramDeleteButton from './RecurringProgramDeleteButton';
import SheetApproverChips from './SheetApproverChips';
import SheetWorkOrderRowActions from './SheetWorkOrderRowActions';
import { initialsOf } from './transferOrderApprovals';
import {
  SHEET_ACTIONS_COL,
  SHEET_APPROVERS_COL,
  SHEET_BADGE,
  SHEET_CELL_PAD,
  SHEET_CHIP,
  SHEET_DATE_CELL_PAD,
  SHEET_DATE_COL,
  SHEET_DATE_HEADER_CELL_PAD,
  SHEET_DATE_LABEL,
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

function sheetDateStatusSublabel(row: WorkOrderSheetRow) {
  return getSheetDateStatusSublabel(row);
}

function SheetRowIndicators({ row }: { row: WorkOrderSheetRow }) {
  if (!row.hasBilling) return null;
  return (
    <span title={row.billingHint ?? 'Billing'} className="inline-flex text-muted-foreground">
      <DollarSign className="h-3 w-3" />
    </span>
  );
}

function statusBadge(row: WorkOrderSheetRow) {
  if (row.status === 'COMPLETED') return null;
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


function SheetMachineCell({
  row,
  showStatusBadge = true,
}: {
  row: WorkOrderSheetRow;
  showStatusBadge?: boolean;
}) {
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
        {showStatusBadge ? statusBadge(row) : null}
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
          <th
            className={cn(SHEET_DATE_COL, SHEET_DATE_HEADER_CELL_PAD, 'text-center')}
            title="Planned work day. Click for actual start vs plan."
          >
            Start
          </th>
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
  if (note.text.includes(' early')) {
    return 'text-blue-700 dark:text-blue-400';
  }
  return 'text-muted-foreground';
}

function startVarianceBadgeClass(startVarianceTone: 'early' | 'late'): string {
  if (startVarianceTone === 'late') {
    return 'border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400';
  }
  return 'border-blue-500/45 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:text-blue-400';
}

function sheetDateDraftBadgeClass(): string {
  return 'border border-dashed border-slate-400/40 bg-slate-500/10 font-normal text-foreground/90 hover:bg-slate-500/16 dark:border-slate-400/35 dark:bg-slate-400/14 dark:text-slate-100 dark:hover:bg-slate-400/20';
}

function sheetDateActiveBadgeClass(): string {
  return 'border border-solid border-amber-500/40 bg-amber-500/10 text-foreground/90 hover:bg-amber-500/16 dark:border-amber-400/35 dark:bg-amber-500/14 dark:text-amber-50 dark:hover:bg-amber-500/20';
}

function sheetDateAttentionBadgeClass(
  kind: WorkOrderSheetAttentionKind,
  startVarianceTone: 'early' | 'late' | null,
): string {
  if (kind === 'completed') {
    return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-400';
  }
  if (kind === 'overdue_not_started') {
    return 'border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:text-red-400';
  }
  if (kind === 'overdue_in_progress') {
    return 'border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400';
  }
  if (startVarianceTone) {
    return startVarianceBadgeClass(startVarianceTone);
  }
  return 'border-transparent text-card-foreground hover:bg-muted/50';
}

function startVarianceUnderlineBarClass(startVarianceTone: 'early' | 'late' | null): string | null {
  if (startVarianceTone === 'early') {
    return 'h-0.5 w-full shrink-0 rounded-full bg-blue-500';
  }
  if (startVarianceTone === 'late') {
    return 'h-0.5 w-full shrink-0 rounded-full bg-amber-500';
  }
  return null;
}

function SheetStartDateCell({
  row,
  programSummary,
  onSheetMutated,
}: {
  row: WorkOrderSheetRow;
  programSummary?: RecurrenceProgramSummary | null;
  onSheetMutated?: () => void;
}) {
  const dateRow = {
    plannedDate: row.plannedDate,
    calendarDate: row.date,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
  const displayDate = getWorkOrderSheetDisplayDate(dateRow);
  const attention = getWorkOrderSheetDateAttention({ ...dateRow, status: row.status });
  const statusSublabel = sheetDateStatusSublabel(row);
  const popoverLines = attention.popoverLines;
  const lifecycleNotes = popoverLines?.lifecycleNotes ?? [];
  const hasAttentionBadge = attention.kind !== 'none';
  const underlineBarClass =
    attention.kind === 'completed' ? startVarianceUnderlineBarClass(attention.startVarianceTone) : null;
  const useStackedLayout = Boolean(underlineBarClass || statusSublabel);
  const showProgramSection = row.isRecurringFromTemplate && programSummary != null;
  const canDeleteProgramDrafts = row.status === 'DRAFT';
  const popoverDates = showProgramSection
    ? programSummary.futureDrafts.slice(0, RECURRENCE_PROGRAM_POPOVER_MAX_DATES)
    : [];
  const truncatedFutureCount = showProgramSection
    ? Math.max(0, programSummary.futureDraftCount - popoverDates.length)
    : 0;
  const completedOccurrences = showProgramSection ? programSummary.completedOccurrences : [];
  const inProgressOccurrences = showProgramSection ? programSummary.inProgressOccurrences : [];

  const programDateItemClass = (isCurrentRow?: boolean) =>
    cn(
      'rounded px-1.5 py-0.5 text-xs',
      isCurrentRow
        ? 'bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300'
        : 'text-muted-foreground',
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            SHEET_DATE_LABEL,
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            hasAttentionBadge
              ? sheetDateAttentionBadgeClass(attention.kind, attention.startVarianceTone)
              : row.status === 'DRAFT'
                ? sheetDateDraftBadgeClass()
                : row.status === 'IN_PROGRESS'
                  ? sheetDateActiveBadgeClass()
                  : 'border-transparent text-card-foreground hover:bg-muted/50',
            useStackedLayout ? 'flex-col gap-0.5 py-1' : null,
          )}
          aria-label={attention.ariaLabel}
          title={
            attention.varianceHeadline
              ? `${attention.varianceHeadline} (planned ${popoverLines?.plannedLabel ?? ''})`
              : undefined
          }
          onClick={(event) => event.stopPropagation()}
        >
          <span className="leading-none">{displayDate}</span>
          {statusSublabel ? (
            <span className={cn('text-[10px] font-normal leading-none', statusSublabel.className)}>
              {statusSublabel.label}
            </span>
          ) : null}
          {underlineBarClass ? <span className={underlineBarClass} aria-hidden /> : null}
        </button>
      </PopoverTrigger>
      {popoverLines ? (
        <PopoverContent
          className="w-56 space-y-2 p-3"
          align="start"
          onClick={(event) => event.stopPropagation()}
        >
          {attention.overdueHeadline ? (
            <div
              className={cn(
                'text-sm font-medium leading-snug',
                attention.kind === 'overdue_in_progress'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-destructive',
              )}
            >
              {attention.overdueHeadline}
            </div>
          ) : null}
          {attention.varianceHeadline ? (
            <div
              className={cn(
                'text-sm font-medium leading-snug',
                attention.varianceHeadline === 'Started late'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-blue-700 dark:text-blue-400',
              )}
            >
              {attention.varianceHeadline}
            </div>
          ) : null}
          <div>
            <div className={cn(SHEET_HEADER, 'normal-case tracking-normal')}>Planned</div>
            <div className={cn('mt-0.5', SHEET_PRIMARY)}>{popoverLines.plannedLabel}</div>
          </div>
          {lifecycleNotes.map((note) => (
            <div
              key={note.text}
              className={cn('text-sm leading-snug', lifecycleNoteToneClass(note))}
            >
              {note.text}
            </div>
          ))}
          {showProgramSection ? (
            <>
              <div className="border-t border-border/60 pt-2">
                <div className={cn(SHEET_HEADER, 'normal-case tracking-normal flex items-center gap-1.5')}>
                  <Repeat2 className="h-3 w-3 shrink-0" />
                  Recurring · {programSummary.cadence}
                </div>
                {completedOccurrences.length > 0 ? (
                  <div className="mt-1.5">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Completed
                    </div>
                    <ul className="mt-1 space-y-1">
                      {completedOccurrences.map((entry) => (
                        <li key={entry.workOrderId} className={programDateItemClass(entry.isCurrentRow)}>
                          {formatRecurrenceProgramDateLabel(entry.displayDate)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {inProgressOccurrences.length > 0 ? (
                  <div className="mt-1.5">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Active
                    </div>
                    <ul className="mt-1 space-y-1">
                      {inProgressOccurrences.map((entry) => (
                        <li key={entry.workOrderId} className={programDateItemClass(entry.isCurrentRow)}>
                          {formatRecurrenceProgramDateLabel(entry.displayDate)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-1.5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Upcoming
                  </div>
                {popoverDates.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {popoverDates.map((draft) => (
                      <li
                        key={draft.workOrderId}
                        className={programDateItemClass(draft.isCurrentRow)}
                      >
                        {formatRecurrenceProgramDateLabel(draft.plannedDate)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No future drafts</p>
                )}
                </div>
                {truncatedFutureCount > 0 ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    +{truncatedFutureCount} more future draft{truncatedFutureCount === 1 ? '' : 's'}
                  </p>
                ) : programSummary.futureDraftCount > 0 ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {programSummary.futureDraftCount} future draft
                    {programSummary.futureDraftCount === 1 ? '' : 's'}
                  </p>
                ) : null}
              </div>
              {canDeleteProgramDrafts ? (
                <RecurringProgramDeleteButton
                  program={programSummary}
                  machineName={row.machineName}
                  onDeleted={onSheetMutated ? () => onSheetMutated() : undefined}
                  className="w-full"
                />
              ) : programSummary.futureDraftCount > 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  {programSummary.futureDraftCount} upcoming draft
                  {programSummary.futureDraftCount === 1 ? '' : 's'} in this program
                </p>
              ) : null}
            </>
          ) : null}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}

export interface WorkOrderSheetDayRowsProps {
  rows: WorkOrderSheetRow[];
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
  showStartDateColumn?: boolean;
  programSummariesByWorkOrderId?: Map<number, RecurrenceProgramSummary>;
}

export function WorkOrderSheetDayRows({
  rows,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
  showStartDateColumn = false,
  programSummariesByWorkOrderId,
}: WorkOrderSheetDayRowsProps) {
  return (
    <tbody>
      {rows.map((workRow, rowIndex) => {
        if (workRow.groupRowSpan >= SHEET_PARTS_SCROLL_MIN && !workRow.isFirstInGroup) {
          return null;
        }

        const partGroupRows =
          workRow.groupRowSpan >= SHEET_PARTS_SCROLL_MIN
            ? rows.slice(rowIndex, rowIndex + workRow.groupRowSpan)
            : [workRow];
        const effectiveRowSpan =
          workRow.groupRowSpan >= SHEET_PARTS_SCROLL_MIN ? 1 : workRow.groupRowSpan;

        return (
        <tr
          key={workRow.key}
          title={workRow.rowTitle ?? undefined}
          className={cn(
            'border-b border-border/40 hover:bg-muted/30',
            onRowClick && 'cursor-pointer',
            !workRow.isFirstInGroup && rowIndex % 2 === 1 && 'bg-muted/10',
          )}
          onClick={() => onRowClick?.(workRow.workOrderId)}
        >
          {showStartDateColumn && workRow.isFirstInGroup ? (
            <td
              rowSpan={effectiveRowSpan}
              className={cn(
                SHEET_DATE_COL,
                'border-r border-border/40 align-middle text-center text-card-foreground',
                SHEET_DATE_CELL_PAD,
              )}
            >
              <SheetStartDateCell
                row={workRow}
                programSummary={programSummariesByWorkOrderId?.get(workRow.workOrderId)}
                onSheetMutated={onSheetMutated}
              />
            </td>
          ) : null}
          {workRow.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn('border-r border-border/40 align-top text-card-foreground', SHEET_CELL_PAD)}
              >
                <SheetMachineCell row={workRow} showStatusBadge={!showStartDateColumn} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_WORKS_COL, 'border-r border-border/40 align-middle text-card-foreground', SHEET_CELL_PAD)}
              >
                <SheetWorksCell works={workRow.works} />
              </td>
            </>
          ) : null}
          <td className={cn('align-middle text-card-foreground', SHEET_CELL_PAD)}>
            {partGroupRows.length >= SHEET_PARTS_SCROLL_MIN ? (
              <SheetPartsGroupCell rows={partGroupRows} />
            ) : (
              <SheetPartCell row={workRow} />
            )}
          </td>
          {workRow.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_WORKERS_COL, 'border-l border-border/40 align-middle', SHEET_CELL_PAD)}
              >
                <SheetWorkersCell workers={workRow.workers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_APPROVERS_COL, 'align-middle', SHEET_CELL_PAD)}
              >
                <SheetApproverChips approvers={workRow.approvers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(SHEET_ACTIONS_COL, 'align-middle', SHEET_CELL_PAD)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <SheetWorkOrderRowActions
                  workOrderId={workRow.workOrderId}
                  workOrderNumber={workRow.workOrderNumber}
                  status={workRow.status}
                  plannedDate={workRow.plannedDate}
                  approvalMet={workRow.approvalMet}
                  machineId={workRow.machineId}
                  approvers={workRow.approvers}
                  currentUserId={currentUserId}
                  onOpenDetail={() => onRowClick?.(workRow.workOrderId)}
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
