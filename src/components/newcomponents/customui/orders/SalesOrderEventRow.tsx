import React from 'react';
import { cn } from '@/lib/utils';
import type { SalesOrderEvent } from '@/types/salesOrder';
import EventLogTimestamp from '@/components/newcomponents/customui/EventLogTimestamp';
import { SO_EVENT_VISUALS } from './salesOrderEventVisuals';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface SalesOrderEventRowProps {
  event: SalesOrderEvent;
  isLast: boolean;
  showAbsoluteTimes?: boolean;
  onToggleTimestampDisplay?: () => void;
}

const SalesOrderEventRow: React.FC<SalesOrderEventRowProps> = ({
  event,
  isLast,
  showAbsoluteTimes = false,
  onToggleTimestampDisplay,
}) => {
  const ev = SO_EVENT_VISUALS[event.event_type] ?? SO_EVENT_VISUALS.default;
  const Icon = ev.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-card-foreground">{event.description}</p>
          <EventLogTimestamp
            createdAt={event.created_at}
            showAbsoluteTimes={showAbsoluteTimes}
            onToggle={onToggleTimestampDisplay}
          />
        </div>
        {event.user_name && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-semibold">
              {initialsOf(event.user_name)}
            </div>
            <span className="text-xs text-muted-foreground">{event.user_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOrderEventRow;
