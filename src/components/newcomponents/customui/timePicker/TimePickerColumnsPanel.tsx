import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayPeriod } from '@/lib/wallTimeFormat';
import {
  HOURS_12,
  HOURS_24,
  PERIODS,
  ROW_HEIGHT_PX,
  TIME_PICKER_VIEWPORT_PX,
  pad2,
  wheelDeltaPx,
} from './timePickerShared';
const COLUMN_LABEL_CLASS =
  'mb-1 flex h-[14px] items-center justify-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground';

/** Colon gutter and min→period spacer */
const COLUMN_GUTTER_CLASS = 'w-[0.6rem] shrink-0';

function TimePickerColumnLabel({ children }: { children: React.ReactNode }) {
  return <p className={COLUMN_LABEL_CLASS}>{children}</p>;
}

/** Narrow spacer; colon gutter and min→period gap use the same width. */
function TimePickerColumnGutter({
  children,
  viewportHeightPx,
}: {
  children?: React.ReactNode;
  viewportHeightPx: number;
}) {
  return (
    <span
      className={cn(
        'flex items-center justify-center text-base font-semibold tabular-nums text-muted-foreground',
        COLUMN_GUTTER_CLASS,
      )}
      style={{ height: viewportHeightPx }}
      aria-hidden={children == null}
    >
      {children}
    </span>
  );
}

interface TimeScrollColumnProps<T extends string | number> {
  label: string;
  items: T[];
  selected: T;
  onSelect: (value: T) => void;
  scrollKey: string;
  formatItem: (item: T) => string;
  viewportHeightPx: number;
  alignToSelection: boolean;
  highlightSelection: boolean;
  /** When false, render only the scroll box (label rendered by parent grid). */
  includeLabel?: boolean;
}

function TimeScrollColumn<T extends string | number>({
  label,
  items,
  selected,
  onSelect,
  scrollKey,
  formatItem,
  viewportHeightPx,
  alignToSelection,
  highlightSelection,
  includeLabel = true,
}: TimeScrollColumnProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const maxScroll = list.scrollHeight - list.clientHeight;
    setCanScrollUp(list.scrollTop > 1);
    setCanScrollDown(maxScroll > 1 && list.scrollTop < maxScroll - 1);
  }, []);

  const scrollSelectedIntoView = useCallback(() => {
    const list = listRef.current;
    if (!list || list.clientHeight <= 0) return false;
    const row = selectedRef.current;
    if (row) {
      list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
    } else {
      const index = items.findIndex((item) => item === selected);
      if (index < 0) return false;
      list.scrollTop = index * ROW_HEIGHT_PX - (list.clientHeight - ROW_HEIGHT_PX) / 2;
    }
    updateScrollEdges();
    return true;
  }, [items, selected, updateScrollEdges]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!alignToSelection) {
      if (list) {
        list.scrollTop = 0;
        updateScrollEdges();
      }
      return;
    }

    let frame = 0;
    let attempts = 0;
    const maxAttempts = 16;

    const run = () => {
      attempts += 1;
      if (scrollSelectedIntoView() || attempts >= maxAttempts) return;
      frame = requestAnimationFrame(run);
    };

    run();
    return () => cancelAnimationFrame(frame);
  }, [scrollKey, alignToSelection, scrollSelectedIntoView, updateScrollEdges]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const onWheel = (event: WheelEvent) => {
      const maxScroll = list.scrollHeight - list.clientHeight;
      if (maxScroll <= 0) return;
      const delta = wheelDeltaPx(event, list.clientHeight);
      const atTop = list.scrollTop <= 0;
      const atBottom = list.scrollTop >= maxScroll - 1;
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) return;
      event.preventDefault();
      event.stopPropagation();
      list.scrollTop += delta;
      updateScrollEdges();
    };

    const onScroll = () => updateScrollEdges();

    list.addEventListener('wheel', onWheel, { passive: false });
    list.addEventListener('scroll', onScroll);
    updateScrollEdges();
    return () => {
      list.removeEventListener('wheel', onWheel);
      list.removeEventListener('scroll', onScroll);
    };
  }, [updateScrollEdges]);

  const scrollByRow = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop += direction * ROW_HEIGHT_PX;
    updateScrollEdges();
  };

  const box = (
      <div
        className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-background"
        style={{ height: viewportHeightPx }}
      >
        <button
          type="button"
          className={cn(
            'flex h-5 shrink-0 items-center justify-center border-b border-border text-muted-foreground transition-colors',
            canScrollUp ? 'hover:bg-accent hover:text-accent-foreground' : 'cursor-default opacity-40',
          )}
          disabled={!canScrollUp}
          aria-label={`Scroll ${label} up`}
          onClick={() => scrollByRow(-1)}
        >
          <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <div
          ref={listRef}
          data-scroll-lock-scrollable=""
          className="time-picker-scroll-hide min-h-0 flex-1 overflow-y-auto overscroll-contain"
          role="listbox"
          aria-label={label}
        >
          {items.map((item) => {
            const active = highlightSelection && item === selected;
            return (
              <button
                key={String(item)}
                ref={active ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  'flex w-full items-center justify-center tabular-nums text-sm transition-colors',
                  active
                    ? 'bg-brand-primary font-medium text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                style={{ height: ROW_HEIGHT_PX }}
                onClick={() => onSelect(item)}
              >
                {formatItem(item)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={cn(
            'flex h-5 shrink-0 items-center justify-center border-t border-border text-muted-foreground transition-colors',
            canScrollDown ? 'hover:bg-accent hover:text-accent-foreground' : 'cursor-default opacity-40',
          )}
          disabled={!canScrollDown}
          aria-label={`Scroll ${label} down`}
          onClick={() => scrollByRow(1)}
        >
          <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>
  );

  if (!includeLabel) {
    return box;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TimePickerColumnLabel>{label}</TimePickerColumnLabel>
      {box}
    </div>
  );
}

function PeriodToggleColumn({
  draftPeriod,
  onPeriodSelect,
  viewportHeightPx,
  highlightSelection,
  includeLabel = true,
}: {
  draftPeriod: DayPeriod;
  onPeriodSelect: (period: DayPeriod) => void;
  viewportHeightPx: number;
  highlightSelection: boolean;
  includeLabel?: boolean;
}) {
  const box = (
    <div
      className="flex w-14 flex-col overflow-hidden rounded-md border border-border bg-background"
      style={{ height: viewportHeightPx }}
      role="radiogroup"
      aria-label="AM or PM"
    >
      {PERIODS.map((period) => {
        const active = highlightSelection && draftPeriod === period;
        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(
              'flex flex-1 items-center justify-center text-sm font-medium tabular-nums transition-colors',
              active
                ? 'bg-brand-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => onPeriodSelect(period)}
          >
            {period}
          </button>
        );
      })}
    </div>
  );

  if (!includeLabel) {
    return box;
  }

  return (
    <div className="flex w-14 shrink-0 flex-col">
      <TimePickerColumnLabel>Period</TimePickerColumnLabel>
      {box}
    </div>
  );
}

export interface TimePickerColumnsPanelProps {
  use24Hour: boolean;
  alignId: string | number;
  /** When true, time columns re-align scroll (e.g. popover open). */
  scrollActive?: boolean;
  /** When false, wheels stay at top with no selected highlight (whole-day preview). */
  highlightSelection?: boolean;
  viewportHeightPx?: number;
  minutes: number[];
  draftHour24: number;
  draftHour12: number;
  draftMinute: number;
  draftPeriod: DayPeriod;
  onHour24Select: (hour: number) => void;
  onHour12Select: (hour12: number) => void;
  onMinuteSelect: (minute: number) => void;
  onPeriodSelect: (period: DayPeriod) => void;
}

const TimePickerColumnsPanel: React.FC<TimePickerColumnsPanelProps> = ({
  use24Hour,
  alignId,
  scrollActive = true,
  highlightSelection = true,
  viewportHeightPx = TIME_PICKER_VIEWPORT_PX,
  minutes,
  draftHour24,
  draftHour12,
  draftMinute,
  draftPeriod,
  onHour24Select,
  onHour12Select,
  onMinuteSelect,
  onPeriodSelect,
}) => {
  const alignToSelection = scrollActive && highlightSelection;
  const columnProps = {
    viewportHeightPx,
    alignToSelection,
    highlightSelection,
  };

  return (
  <div
    className={cn(
      'grid gap-x-0',
      use24Hour
        ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
        : 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_3.5rem]',
    )}
  >
    <TimePickerColumnLabel>Hour</TimePickerColumnLabel>
    <span aria-hidden className={COLUMN_GUTTER_CLASS} />
    <TimePickerColumnLabel>Min</TimePickerColumnLabel>
    {!use24Hour ? (
      <>
        <span aria-hidden className={COLUMN_GUTTER_CLASS} />
        <TimePickerColumnLabel>Period</TimePickerColumnLabel>
      </>
    ) : null}

    {use24Hour ? (
      <TimeScrollColumn
        label="Hour"
        includeLabel={false}
        items={HOURS_24}
        selected={draftHour24}
        scrollKey={`${alignId}-${alignToSelection}-24h-${draftHour24}`}
        formatItem={(h) => pad2(h)}
        onSelect={onHour24Select}
        {...columnProps}
      />
    ) : (
      <TimeScrollColumn
        label="Hour"
        includeLabel={false}
        items={HOURS_12}
        selected={draftHour12}
        scrollKey={`${alignId}-${alignToSelection}-12h-${draftHour12}-${draftPeriod}`}
        formatItem={(h) => String(h)}
        onSelect={onHour12Select}
        {...columnProps}
      />
    )}
    <TimePickerColumnGutter viewportHeightPx={viewportHeightPx}>:</TimePickerColumnGutter>
    <TimeScrollColumn
      label="Min"
      includeLabel={false}
      items={minutes}
      selected={draftMinute}
      scrollKey={`${alignId}-${alignToSelection}-m-${draftMinute}`}
      formatItem={(m) => pad2(m)}
      onSelect={onMinuteSelect}
      {...columnProps}
    />
    {!use24Hour ? (
      <>
        <TimePickerColumnGutter viewportHeightPx={viewportHeightPx} />
        <PeriodToggleColumn
          includeLabel={false}
          draftPeriod={draftPeriod}
          onPeriodSelect={onPeriodSelect}
          viewportHeightPx={viewportHeightPx}
          highlightSelection={highlightSelection}
        />
      </>
    ) : null}
  </div>
  );
};

export default TimePickerColumnsPanel;
