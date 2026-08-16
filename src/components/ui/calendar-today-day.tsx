import * as React from 'react';
import { Button, useDayRender, type DayProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

/** react-day-picker Day with a hover-only hint on today's date. */
export function CalendarDayWithTodayTooltip(props: DayProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dayRender = useDayRender(props.date, props.displayMonth, buttonRef);

  if (dayRender.isHidden) {
    return <div role="gridcell" />;
  }

  if (!dayRender.isButton) {
    return <div {...dayRender.divProps} />;
  }

  const dayButton = <Button name="day" ref={buttonRef} {...dayRender.buttonProps} />;

  if (!dayRender.activeModifiers.today) {
    return dayButton;
  }

  return (
    <span className="group/today relative inline-flex">
      {dayButton}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap',
          'rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md',
          'opacity-0 transition-opacity duration-150',
          'group-hover/today:opacity-100',
        )}
      >
        Today
      </span>
    </span>
  );
}
