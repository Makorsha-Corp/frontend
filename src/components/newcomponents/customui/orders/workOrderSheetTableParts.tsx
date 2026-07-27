import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import { getSheetDateStatusSublabel } from '@/pages/newpages/orders/workOrderSheetData';
import {
  getWorkOrderSheetDateAttention,
  getWorkOrderSheetDisplayDate,
  WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED,
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
import { DollarSign } from 'lucide-react';
import {
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import { RecurrenceProgramPopoverSections } from './RecurrenceProgramPopoverSections';
import SheetApproverChips from './SheetApproverChips';
import SheetWorkOrderRowActions from './SheetWorkOrderRowActions';
import { initialsOf } from './transferOrderApprovals';
import {
  SHEET_BADGE,
  SHEET_CELL_PAD,
  SHEET_CHIP,
  SHEET_DATE_CELL_PAD,
  SHEET_DATE_HEADER_CELL_PAD,
  SHEET_DATE_LABEL,
  SHEET_HEADER,
  SHEET_HEADER_CELL_PAD,
  SHEET_META,
  SHEET_PRIMARY,
  SHEET_DETAIL_POPOVER,
  SHEET_DETAIL_POPOVER_ITEM,
  sheetColumnWidths,
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
const SHEET_PARTS_INLINE_GAP_PX = 8;
const SHEET_PARTS_INLINE_SEP_PX = 1;

function sheetPartMetaText(row: WorkOrderSheetRow): string | null {
  const actionLabel = row.actionType ? workOrderItemActionLabel(row.actionType) : null;
  const qtyLabel =
    row.quantity != null && row.unit !== '—'
      ? `${row.quantity} ${row.unit}`
      : row.quantity != null
        ? String(row.quantity)
        : null;

  const metaParts = [actionLabel, qtyLabel].filter(Boolean);
  return metaParts.length > 0 ? metaParts.join(' · ') : null;
}

function sheetPartsInlineLayoutWidth(
  count: number,
  total: number,
  blockWidths: number[],
  overflowBadgeWidth: number,
): number {
  const overflow = total - count;
  const childCount = count + Math.max(0, count - 1) + (overflow > 0 ? 2 : 0);
  let width = blockWidths.slice(0, count).reduce((sum, blockWidth) => sum + blockWidth, 0);
  width += Math.max(0, count - 1) * SHEET_PARTS_INLINE_SEP_PX;
  if (overflow > 0) {
    width += SHEET_PARTS_INLINE_SEP_PX + overflowBadgeWidth;
  }
  width += Math.max(0, childCount - 1) * SHEET_PARTS_INLINE_GAP_PX;
  return width;
}

function useSheetPartsVisibleCount(validRows: WorkOrderSheetRow[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(1);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure || validRows.length === 0) {
      setVisibleCount(0);
      return;
    }

    const available = container.clientWidth;
    if (available <= 0) return;

    const blocks = measure.querySelectorAll<HTMLElement>('[data-sheet-part-measure]');
    const overflowEl = measure.querySelector<HTMLElement>('[data-sheet-part-overflow]');
    if (blocks.length !== validRows.length || !overflowEl) return;

    const blockWidths = Array.from(blocks).map((block) => block.getBoundingClientRect().width);
    const total = validRows.length;

    let nextVisible = 1;
    for (let count = total; count >= 1; count -= 1) {
      const overflow = total - count;
      if (overflow > 0) {
        overflowEl.textContent = `+${overflow}`;
      }
      const overflowBadgeWidth = overflow > 0 ? overflowEl.getBoundingClientRect().width : 0;
      if (
        sheetPartsInlineLayoutWidth(count, total, blockWidths, overflowBadgeWidth) <= available
      ) {
        nextVisible = count;
        break;
      }
    }

    setVisibleCount((current) => (current === nextVisible ? current : nextVisible));
  }, [validRows]);

  useLayoutEffect(() => {
    recompute();
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => recompute());
    observer.observe(container);
    return () => observer.disconnect();
  }, [recompute]);

  return { containerRef, measureRef, visibleCount };
}

function SheetPartMeasureBlock({ row }: { row: WorkOrderSheetRow }) {
  const metaText = sheetPartMetaText(row);

  return (
    <div data-sheet-part-measure className="inline-flex shrink-0 flex-col whitespace-nowrap">
      <span className={cn(SHEET_PRIMARY, 'leading-tight')}>{row.partName}</span>
      {metaText ? <span className={cn(SHEET_CHIP, 'leading-tight')}>{metaText}</span> : null}
    </div>
  );
}

function SheetPartStackedBlock({
  row,
  className,
}: {
  row: WorkOrderSheetRow;
  className?: string;
}) {
  const metaText = sheetPartMetaText(row);

  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn(SHEET_PRIMARY, 'truncate leading-tight')}>{row.partName}</div>
      {metaText ? (
        <div className={cn(SHEET_CHIP, 'truncate leading-tight')}>{metaText}</div>
      ) : null}
    </div>
  );
}

function SheetPartsInlinePreview({
  containerRef,
  visibleRows,
  overflowCount,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visibleRows: WorkOrderSheetRow[];
  overflowCount: number;
}) {
  const singlePartFillsCell = visibleRows.length === 1 && overflowCount === 0;

  return (
    <div ref={containerRef} className="flex min-w-0 items-start gap-2 overflow-hidden">
      {visibleRows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 ? (
            <span className="w-px shrink-0 self-stretch bg-border" aria-hidden />
          ) : null}
          <SheetPartStackedBlock
            row={row}
            className={cn('shrink-0', singlePartFillsCell && 'min-w-0 max-w-full flex-1')}
          />
        </React.Fragment>
      ))}
      {overflowCount > 0 ? (
        <>
          <span className="w-px shrink-0 self-stretch bg-border" aria-hidden />
          <span className={cn(SHEET_CHIP, 'shrink-0 self-center pt-0.5 font-medium')}>
            +{overflowCount}
          </span>
        </>
      ) : null}
    </div>
  );
}

function SheetPartsCell({
  previewRows,
  detailRows,
}: {
  previewRows: WorkOrderSheetRow[];
  detailRows: WorkOrderSheetRow[];
}) {
  const [open, setOpen] = useState(false);
  const validPreviewRows = previewRows.filter((row) => row.partName !== '—');
  const validDetailRows = detailRows.filter((row) => row.partName !== '—');
  const { containerRef, measureRef, visibleCount } = useSheetPartsVisibleCount(validPreviewRows);

  if (validDetailRows.length === 0) {
    return (
      <div className={cn(SHEET_CELL_PAD, 'text-card-foreground')}>
        <SheetEmptyCell>No parts required</SheetEmptyCell>
      </div>
    );
  }

  const visibleRows = validPreviewRows.slice(0, Math.min(visibleCount, validPreviewRows.length));
  const overflowCount = validPreviewRows.length - visibleRows.length;

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-[-10000px] top-0 h-px w-px overflow-visible opacity-0"
      >
        <div className="flex w-max items-start gap-2">
          {validPreviewRows.map((row) => (
            <SheetPartMeasureBlock key={row.key} row={row} />
          ))}
          <span
            data-sheet-part-overflow
            className={cn(SHEET_CHIP, 'shrink-0 self-center pt-0.5 font-medium')}
          >
            +{validPreviewRows.length}
          </span>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              SHEET_CELL_PAD,
              'block min-h-[2.75rem] w-full min-w-0 cursor-pointer text-left text-card-foreground',
              'transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            )}
            aria-label={`View ${validDetailRows.length} part${validDetailRows.length === 1 ? '' : 's'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <SheetPartsInlinePreview
              containerRef={containerRef}
              visibleRows={visibleRows}
              overflowCount={overflowCount}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(SHEET_DETAIL_POPOVER, 'w-[min(18rem,92vw)] space-y-3 p-3')}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={cn(SHEET_HEADER, 'normal-case tracking-normal text-foreground/90')}>
            Parts / consumables
          </div>
          <div className="space-y-2">
            {validDetailRows.map((row) => (
              <SheetPartStackedBlock
                key={row.key}
                row={row}
                className={SHEET_DETAIL_POPOVER_ITEM}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export function WorkOrderSheetColGroup({
  showStartDateColumn = false,
}: {
  showStartDateColumn?: boolean;
}) {
  const cols = sheetColumnWidths(showStartDateColumn);

  return (
    <colgroup>
      {showStartDateColumn && cols.start ? <col className={cols.start} /> : null}
      <col className={cols.machine} />
      <col className={cols.works} />
      <col className={cols.parts} />
      <col className={cols.workers} />
      <col className={cols.approvers} />
      <col className={cols.actions} />
    </colgroup>
  );
}

export function WorkOrderSheetTableHeader({
  showStartDateColumn = false,
}: {
  showStartDateColumn?: boolean;
}) {
  const cols = sheetColumnWidths(showStartDateColumn);

  return (
    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
      <tr className={cn('border-b border-border/60 text-left', SHEET_HEADER)}>
        {showStartDateColumn && cols.start ? (
          <th
            className={cn(cols.start, SHEET_DATE_HEADER_CELL_PAD, 'text-center')}
            title="Planned work day. Click for actual start vs plan."
          >
            Start
          </th>
        ) : null}
        <th className={cn(cols.machine, SHEET_HEADER_CELL_PAD)}>Machine</th>
        <th className={cn(cols.works, SHEET_HEADER_CELL_PAD)}>Works</th>
        <th className={cn(cols.parts, SHEET_HEADER_CELL_PAD)}>Parts / consumables</th>
        <th className={cn(cols.workers, SHEET_HEADER_CELL_PAD)}>Workers</th>
        <th className={cn(cols.approvers, SHEET_HEADER_CELL_PAD)}>Approvers</th>
        <th className={cn(cols.actions, SHEET_HEADER_CELL_PAD)}>Actions</th>
      </tr>
    </thead>
  );
}

function lifecycleNoteToneClass(note: WorkOrderLifecycleNote) {
  if (!WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED) {
    return 'text-muted-foreground';
  }
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
  onRowClick,
}: {
  row: WorkOrderSheetRow;
  programSummary?: RecurrenceProgramSummary | null;
  onSheetMutated?: () => void;
  onRowClick?: (workOrderId: number) => void;
}) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const dateRow = {
    plannedDate: row.plannedDate,
    calendarDate: row.date,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
  };
  const displayDate = getWorkOrderSheetDisplayDate(dateRow);
  const attention = getWorkOrderSheetDateAttention({ ...dateRow, status: row.status });
  const statusSublabel = sheetDateStatusSublabel(row);
  const popoverLines = attention.popoverLines;
  const lifecycleNotes = popoverLines?.lifecycleNotes ?? [];
  const hasAttentionBadge =
    WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED
      ? attention.kind !== 'none'
      : attention.kind === 'completed';
  const underlineBarClass =
    WORK_ORDER_SHEET_DATE_VARIANCE_UI_ENABLED &&
    attention.kind === 'completed'
      ? startVarianceUnderlineBarClass(attention.startVarianceTone)
      : null;
  const useStackedLayout = Boolean(underlineBarClass || statusSublabel);
  const showProgramSection = row.isRecurringFromTemplate && programSummary != null;

  const handleOccurrenceClick = (workOrderId: number) => {
    setDatePopoverOpen(false);
    onRowClick?.(workOrderId);
  };

  return (
    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
          className={cn(SHEET_DETAIL_POPOVER, 'w-56 space-y-2 p-3')}
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
          {attention.loggedLaterHeadline ? (
            <div className="text-sm font-medium leading-snug text-amber-700 dark:text-amber-400">
              {attention.loggedLaterHeadline}
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
                <RecurrenceProgramPopoverSections
                  program={programSummary}
                  variant="compact"
                  showCadenceHeader
                  sectionHeaderClassName={cn(SHEET_HEADER, 'normal-case tracking-normal')}
                  onOccurrenceClick={onRowClick ? handleOccurrenceClick : undefined}
                />
              </div>
              {programSummary.futureDraftCount > 0 ? (
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
  const cols = sheetColumnWidths(showStartDateColumn);

  return (
    <tbody>
      {rows.map((workRow, rowIndex) => {
        if (workRow.groupRowSpan >= SHEET_PARTS_SCROLL_MIN && !workRow.isFirstInGroup) {
          return null;
        }

        const orderPartRows = rows.filter(
          (row) => row.workOrderId === workRow.workOrderId && row.partName !== '—',
        );
        const previewRows =
          workRow.groupRowSpan >= SHEET_PARTS_SCROLL_MIN ? orderPartRows : [workRow];
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
          {showStartDateColumn && workRow.isFirstInGroup && cols.start ? (
            <td
              rowSpan={effectiveRowSpan}
              className={cn(
                cols.start,
                'border-r border-border/40 align-middle text-center text-card-foreground',
                SHEET_DATE_CELL_PAD,
              )}
            >
              <SheetStartDateCell
                row={workRow}
                programSummary={programSummariesByWorkOrderId?.get(workRow.workOrderId)}
                onSheetMutated={onSheetMutated}
                onRowClick={onRowClick}
              />
            </td>
          ) : null}
          {workRow.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(
                  cols.machine,
                  'border-r border-border/40 align-top text-card-foreground',
                  SHEET_CELL_PAD,
                )}
              >
                <SheetMachineCell row={workRow} showStatusBadge={!showStartDateColumn} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(
                  cols.works,
                  'border-r border-border/40 align-middle text-card-foreground',
                  SHEET_CELL_PAD,
                )}
              >
                <SheetWorksCell works={workRow.works} />
              </td>
            </>
          ) : null}
          <td className={cn(cols.parts, 'relative p-0 align-middle text-card-foreground')}>
            <SheetPartsCell previewRows={previewRows} detailRows={orderPartRows} />
          </td>
          {workRow.isFirstInGroup ? (
            <>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(cols.workers, 'border-l border-border/40 align-middle', SHEET_CELL_PAD)}
              >
                <SheetWorkersCell workers={workRow.workers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(cols.approvers, 'align-middle', SHEET_CELL_PAD)}
              >
                <SheetApproverChips approvers={workRow.approvers} />
              </td>
              <td
                rowSpan={effectiveRowSpan}
                className={cn(cols.actions, 'align-middle', SHEET_CELL_PAD)}
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
