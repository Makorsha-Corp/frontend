import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { CALENDAR_CATEGORY_STYLES } from './calendarCategoryStyles';

export interface CalendarEventPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
  className?: string;
}

function formatMetaValue(value: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

const CalendarEventPopover: React.FC<CalendarEventPopoverProps> = ({
  event,
  children,
  className,
}) => {
  const style = CALENDAR_CATEGORY_STYLES[event.category];
  const metaEntries = Object.entries(event.meta ?? {}).filter(
    ([, value]) => value != null && value !== '',
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('text-left', className)}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {style.label} · {event.date_label}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{event.title}</p>
          {event.subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.subtitle}</p>
          ) : null}
        </div>
        {metaEntries.length > 0 ? (
          <dl className="space-y-2 px-4 py-3 text-xs">
            {metaEntries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-3">
                <dt className="capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-right font-medium text-foreground">{formatMetaValue(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="border-t border-border px-4 py-3">
          <Button asChild size="sm" className="w-full">
            <Link to={event.link}>
              Open record
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarEventPopover;
