import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface CalendarStripeEventCardProps {
  event: CalendarEvent;
  whenLabel?: string | null;
  /** Show date role line (Planned start, etc.). Default true. */
  showDateLabel?: boolean;
  showSubtitle?: boolean;
  size?: 'compact' | 'comfortable';
  className?: string;
}

const CalendarStripeEventCard: React.FC<CalendarStripeEventCardProps> = ({
  event,
  whenLabel = null,
  showDateLabel = true,
  showSubtitle = true,
  size = 'compact',
  className,
}) => {
  const style = getCategoryStyle(event.category);
  const comfortable = size === 'comfortable';

  return (
    <div
      className={cn(
        'w-full rounded-md border border-border/60 bg-card text-left leading-normal shadow-sm transition-[background-color,box-shadow,border-color] hover:bg-muted/50',
        'border-l-[3px] text-xs',
        comfortable ? 'px-3 py-3' : 'px-2 py-2',
        style.stripe,
        className,
      )}
    >
      <p
        className={cn(
          'truncate font-semibold leading-tight text-foreground',
          comfortable ? 'text-sm' : 'text-sm',
        )}
      >
        {event.title}
      </p>
      {whenLabel ? (
        <p className="mt-0.5 truncate tabular-nums text-xs text-foreground/85">{whenLabel}</p>
      ) : null}
      {showSubtitle && event.subtitle ? (
        <p className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground">{event.subtitle}</p>
      ) : null}
      {showDateLabel ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.date_label}</p>
      ) : null}
    </div>
  );
};

export default CalendarStripeEventCard;
