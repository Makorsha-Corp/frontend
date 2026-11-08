import React from 'react';
import {
  CircleDot,
  History,
  MessageSquare,
  Paperclip,
  Trash2,
} from 'lucide-react';

import EventLogTimestamp from '@/components/newcomponents/customui/EventLogTimestamp';
import { cn } from '@/lib/utils';
import type { HelpTicketEvent } from '@/types/helpTicket';

const EVENT_VISUALS: Record<string, { icon: React.ElementType; wrap: string; color: string }> = {
  created: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  status_changed: { icon: CircleDot, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  discussion_message: {
    icon: MessageSquare,
    wrap: 'bg-brand-primary/10',
    color: 'text-brand-primary',
  },
  discussion_reply: {
    icon: MessageSquare,
    wrap: 'bg-muted',
    color: 'text-muted-foreground',
  },
  attachment_added: { icon: Paperclip, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  attachment_removed: { icon: Trash2, wrap: 'bg-muted', color: 'text-muted-foreground' },
  default: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

interface HelpTicketEventLogRowProps {
  event: HelpTicketEvent;
  isLast: boolean;
  showAbsoluteTimes?: boolean;
  onToggleTimestampDisplay?: () => void;
}

const HelpTicketEventLogRow: React.FC<HelpTicketEventLogRowProps> = ({
  event,
  isLast,
  showAbsoluteTimes = false,
  onToggleTimestampDisplay,
}) => {
  const visual = EVENT_VISUALS[event.event_type] ?? EVENT_VISUALS.default;
  const Icon = visual.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', visual.wrap)}>
          <Icon className={cn('h-4 w-4', visual.color)} />
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">{event.description}</p>
            {event.user_name ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.user_name}</p>
            ) : null}
          </div>
          <EventLogTimestamp
            createdAt={event.created_at}
            showAbsoluteTimes={showAbsoluteTimes}
            onToggle={onToggleTimestampDisplay}
          />
        </div>
      </div>
    </div>
  );
};

export default HelpTicketEventLogRow;
