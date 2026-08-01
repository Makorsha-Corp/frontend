import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryEventGroup } from '@/pages/newpages/calendar/calendarDateUtils';
import {
  iterateMonthCellRowFit,
  overflowProbeCount,
} from '@/pages/newpages/calendar/monthCellChipFit';
import type { MonthCellLayoutConfig } from './calendarMonthCellLayouts';
import MonthEventChip from './MonthEventChip';
import MonthOverflowChip from './MonthOverflowChip';

const CHIP_ROW_GAP_PX = 4;
const OVERFLOW_PROBE_COUNTS = [1, 9, 99, 999, 9999] as const;

export interface MonthCellMeasuredChipRowsProps {
  groups: CategoryEventGroup[];
  totalEventCount: number;
  layout: MonthCellLayoutConfig;
}

function readChipWidths(row: HTMLElement | null): number[] {
  if (!row) return [];
  return Array.from(row.children).map((child) => child.getBoundingClientRect().width);
}

const MonthCellMeasuredChipRows: React.FC<MonthCellMeasuredChipRowsProps> = ({
  groups,
  totalEventCount,
  layout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitPlan, setFitPlan] = useState(() => ({
    visiblePerRow: groups.map((group) => group.events.length),
    overflowCount: 0,
  }));

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measureRoot = measureRef.current;
    if (!container || !measureRoot || groups.length === 0) return;

    const measure = () => {
      const rowInputs = groups.map((group, rowIndex) => {
        const measureRow = measureRoot.querySelector<HTMLElement>(
          `[data-measure-row="${rowIndex}"]`,
        );
        const liveRow = container.querySelector<HTMLElement>(`[data-live-row="${rowIndex}"]`);
        return {
          chipWidths: readChipWidths(measureRow),
          availableWidth: liveRow?.clientWidth ?? container.clientWidth,
        };
      });

      const overflowWidthForCount = (count: number) => {
        const probe = measureRoot.querySelector<HTMLElement>(
          `[data-measure-overflow="${overflowProbeCount(count)}"]`,
        );
        return probe?.getBoundingClientRect().width ?? 24;
      };

      setFitPlan(
        iterateMonthCellRowFit(rowInputs, totalEventCount, overflowWidthForCount, CHIP_ROW_GAP_PX),
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const row of groups.keys()) {
      const liveRow = container.querySelector<HTMLElement>(`[data-live-row="${row}"]`);
      if (liveRow) observer.observe(liveRow);
    }

    return () => observer.disconnect();
  }, [groups, totalEventCount]);

  const lastGroupIndex = groups.length - 1;

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute h-0 w-full overflow-hidden"
      >
        {groups.map((group, rowIndex) => (
          <div
            key={`measure-${group.category}`}
            data-measure-row={rowIndex}
            className={cn('flex w-full flex-nowrap', layout.chipGapX)}
          >
            {group.events.map((event) => (
              <MonthEventChip
                key={`measure-${event.id}`}
                event={event}
                chipText={layout.chipText}
                chipPadding={layout.chipPadding}
              />
            ))}
          </div>
        ))}
        <div className={cn('flex', layout.chipGapX)}>
          {OVERFLOW_PROBE_COUNTS.map((probeCount) => (
            <div key={probeCount} data-measure-overflow={probeCount} className="inline-flex">
              <MonthOverflowChip
                count={probeCount}
                chipText={layout.overflowText}
                chipPadding={layout.chipPadding}
              />
            </div>
          ))}
        </div>
      </div>

      <div ref={containerRef} className={cn('min-h-0 w-full min-w-0 flex-1 overflow-hidden', layout.stackGap)}>
        {groups.map((group, rowIndex) => {
          const visibleCount = fitPlan.visiblePerRow[rowIndex] ?? 0;
          const visibleEvents = group.events.slice(0, visibleCount);

          return (
            <div
              key={group.category}
              data-live-row={rowIndex}
              className={cn(
                'flex w-full min-w-0 flex-nowrap items-start overflow-hidden',
                layout.chipGapX,
                rowIndex > 0 && layout.categoryGap,
              )}
            >
              {visibleEvents.map((event) => (
                <MonthEventChip
                  key={event.id}
                  event={event}
                  chipText={layout.chipText}
                  chipPadding={layout.chipPadding}
                />
              ))}
              {rowIndex === lastGroupIndex && fitPlan.overflowCount > 0 ? (
                <MonthOverflowChip
                  count={fitPlan.overflowCount}
                  chipText={layout.overflowText}
                  chipPadding={layout.chipPadding}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MonthCellMeasuredChipRows;
