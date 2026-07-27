import React from 'react';
import { format, startOfDay } from 'date-fns';
import { Repeat2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  formatRecurrenceProgramDateLabel,
  RECURRENCE_PROGRAM_POPOVER_MAX_DATES,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';

export interface RecurrenceProgramPopoverSectionsProps {
  program: RecurrenceProgramSummary;
  /** compact = sheet date popover; detailed = detail panel popover */
  variant?: 'compact' | 'detailed';
  maxUpcoming?: number;
  showCadenceHeader?: boolean;
  sectionHeaderClassName?: string;
  listClassName?: string;
  /** Open the selected work order (e.g. sheet row / detail panel navigation). */
  onOccurrenceClick?: (workOrderId: number) => void;
}

function programDateItemClass(isCurrentRow?: boolean, extra?: string) {
  return cn(
    'rounded px-1.5 py-0.5 text-xs',
    isCurrentRow
      ? 'bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300'
      : 'text-muted-foreground',
    extra,
  );
}

function detailedOccurrenceRowClass(isCurrentRow?: boolean) {
  return cn(
    'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm',
    isCurrentRow
      ? 'border-violet-500/40 bg-violet-500/10'
      : 'border-border/60 bg-muted/50 dark:bg-muted/40',
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function ProgramOccurrenceRow({
  workOrderId,
  isCurrentRow,
  variant,
  onOccurrenceClick,
  label,
  trailing,
}: {
  workOrderId: number;
  isCurrentRow?: boolean;
  variant: 'compact' | 'detailed';
  onOccurrenceClick?: (workOrderId: number) => void;
  label: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const isInteractive = Boolean(onOccurrenceClick);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onOccurrenceClick?.(workOrderId);
  };

  if (variant === 'compact') {
    const className = cn(
      programDateItemClass(isCurrentRow),
      isInteractive &&
        'w-full cursor-pointer text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      isInteractive && !isCurrentRow && 'hover:text-foreground',
    );

    if (isInteractive) {
      return (
        <li>
          <button type="button" className={className} onClick={handleClick}>
            {label}
          </button>
        </li>
      );
    }

    return <li className={className}>{label}</li>;
  }

  const rowClassName = cn(
    detailedOccurrenceRowClass(isCurrentRow),
    isInteractive &&
      'w-full cursor-pointer text-left transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  const content = (
    <>
      <span className="font-medium">{label}</span>
      {trailing}
    </>
  );

  if (isInteractive) {
    return (
      <li>
        <button type="button" className={rowClassName} onClick={handleClick}>
          {content}
        </button>
      </li>
    );
  }

  return <li className={rowClassName}>{content}</li>;
}

function OccurrenceList({
  entries,
  variant,
  getDateLabel,
  onOccurrenceClick,
}: {
  entries: Array<{ workOrderId: number; isCurrentRow?: boolean; displayDate: string }>;
  variant: 'compact' | 'detailed';
  getDateLabel: (entry: { displayDate: string }) => string;
  onOccurrenceClick?: (workOrderId: number) => void;
}) {
  if (entries.length === 0) return null;

  const listClassName = variant === 'compact' ? 'mt-1 space-y-1' : 'mt-1 space-y-1.5';

  return (
    <ul className={listClassName}>
      {entries.map((entry) => (
        <ProgramOccurrenceRow
          key={entry.workOrderId}
          workOrderId={entry.workOrderId}
          isCurrentRow={entry.isCurrentRow}
          variant={variant}
          onOccurrenceClick={onOccurrenceClick}
          label={getDateLabel(entry)}
        />
      ))}
    </ul>
  );
}

function UpcomingDraftList({
  drafts,
  variant,
  onOccurrenceClick,
}: {
  drafts: RecurrenceProgramSummary['allDrafts'];
  variant: 'compact' | 'detailed';
  onOccurrenceClick?: (workOrderId: number) => void;
}) {
  const todayIso = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const listClassName =
    variant === 'compact' ? 'mt-1 space-y-1' : 'mt-1 max-h-48 space-y-1.5 overflow-y-auto pr-1';

  return (
    <ul className={listClassName}>
      {drafts.map((draft) => {
        const isToday = draft.plannedDate === todayIso;
        return (
          <ProgramOccurrenceRow
            key={draft.workOrderId}
            workOrderId={draft.workOrderId}
            isCurrentRow={draft.isCurrentRow}
            variant={variant}
            onOccurrenceClick={onOccurrenceClick}
            label={formatRecurrenceProgramDateLabel(draft.plannedDate)}
            trailing={
              variant === 'detailed' && !draft.isFuture ? (
                isToday ? (
                  <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
                    Today
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
                    Past
                  </Badge>
                )
              ) : undefined
            }
          />
        );
      })}
    </ul>
  );
}

export function RecurrenceProgramPopoverSections({
  program,
  variant = 'detailed',
  maxUpcoming = RECURRENCE_PROGRAM_POPOVER_MAX_DATES,
  showCadenceHeader = false,
  sectionHeaderClassName,
  listClassName,
  onOccurrenceClick,
}: RecurrenceProgramPopoverSectionsProps) {
  const { completedOccurrences, inProgressOccurrences, allDrafts, futureDrafts, futureDraftCount } =
    program;

  const upcomingDrafts =
    variant === 'compact'
      ? futureDrafts.slice(0, maxUpcoming)
      : maxUpcoming >= allDrafts.length
        ? allDrafts
        : allDrafts.slice(0, maxUpcoming);
  const truncatedFutureCount =
    variant === 'compact'
      ? Math.max(0, futureDrafts.length - upcomingDrafts.length)
      : 0;

  const hasAnyContent =
    completedOccurrences.length > 0 ||
    inProgressOccurrences.length > 0 ||
    allDrafts.length > 0;

  if (!hasAnyContent) {
    return <p className="text-sm text-muted-foreground">No occurrences in this program yet.</p>;
  }

  return (
    <div className={cn('space-y-1.5', listClassName)}>
      {showCadenceHeader ? (
        <div
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground',
            sectionHeaderClassName,
          )}
        >
          <Repeat2 className="h-3 w-3 shrink-0" />
          Recurring · {program.cadence}
        </div>
      ) : null}

      {completedOccurrences.length > 0 ? (
        <div className={showCadenceHeader ? 'mt-1.5' : undefined}>
          <SectionLabel>Completed</SectionLabel>
          <OccurrenceList
            entries={completedOccurrences}
            variant={variant}
            getDateLabel={(entry) => formatRecurrenceProgramDateLabel(entry.displayDate)}
            onOccurrenceClick={onOccurrenceClick}
          />
        </div>
      ) : null}

      {inProgressOccurrences.length > 0 ? (
        <div className="mt-1.5">
          <SectionLabel>Active</SectionLabel>
          <OccurrenceList
            entries={inProgressOccurrences}
            variant={variant}
            getDateLabel={(entry) => formatRecurrenceProgramDateLabel(entry.displayDate)}
            onOccurrenceClick={onOccurrenceClick}
          />
        </div>
      ) : null}

      <div className="mt-1.5">
        <SectionLabel>Upcoming</SectionLabel>
        {upcomingDrafts.length > 0 ? (
          <UpcomingDraftList
            drafts={upcomingDrafts}
            variant={variant}
            onOccurrenceClick={onOccurrenceClick}
          />
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {variant === 'compact' ? 'No future drafts' : 'No draft orders'}
          </p>
        )}
        {truncatedFutureCount > 0 ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            +{truncatedFutureCount} more future draft{truncatedFutureCount === 1 ? '' : 's'}
          </p>
        ) : futureDraftCount > 0 && variant === 'compact' ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {futureDraftCount} future draft{futureDraftCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
