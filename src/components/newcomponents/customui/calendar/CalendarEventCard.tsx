import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useMillTimezone } from '@/hooks/useMillTimezone';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import type { CalendarEvent } from '@/types/calendar';
import CalendarEventPopover from './CalendarEventPopover';
import CalendarStripeEventCard from './CalendarStripeEventCard';
import { formatCalendarEventWhen } from './calendarEventWhen';

export interface CalendarEventCardProps {
  event: CalendarEvent;
  variant: 'day' | 'agenda';
  className?: string;
}

const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ event, variant, className }) => {
  const millTimezone = useMillTimezone();
  const { use24Hour } = useUserTimeFormat();
  const whenLabel = useMemo(
    () => formatCalendarEventWhen(event, millTimezone, use24Hour),
    [event, millTimezone, use24Hour],
  );

  return (
    <CalendarEventPopover event={event} className={cn('block w-full', className)}>
      <CalendarStripeEventCard
        event={event}
        whenLabel={whenLabel}
        showSubtitle
        size={variant === 'day' ? 'comfortable' : 'compact'}
      />
    </CalendarEventPopover>
  );
};

export default CalendarEventCard;
