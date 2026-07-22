import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { CALENDAR_CATEGORY_STYLES } from './calendarCategoryStyles';
import CalendarEventPreviewBody from './CalendarEventPreviewBody';
import {
  getCalendarEventOpenHref,
  getCalendarPopoverContentClass,
} from './calendarEventLinks';

export interface CalendarEventPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
  className?: string;
}

const CalendarEventPopover: React.FC<CalendarEventPopoverProps> = ({
  event,
  children,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const style = CALENDAR_CATEGORY_STYLES[event.category];
  const openHref = getCalendarEventOpenHref(event);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('text-left', className)}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(getCalendarPopoverContentClass(event.source_type), 'z-50')}
        align="start"
        collisionPadding={16}
        sideOffset={8}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {style.label} · {event.date_label}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{event.title}</p>
            {event.subtitle ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.subtitle}</p>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <CalendarEventPreviewBody event={event} open={open} />
          </div>
          <div className="shrink-0 border-t border-border bg-background px-4 py-3">
            <Button asChild size="sm" className="w-full">
              <Link to={openHref}>
                Open record
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarEventPopover;
