import EventLogTimestamp from '@/components/newcomponents/customui/EventLogTimestamp';
import { cn } from '@/lib/utils';
import type { AttachmentMarkupEvent } from '@/types/attachment';

import { summarizeMarkupSession } from './formatMarkupEventDisplay';
import { MARKUP_EVENT_VISUALS } from './markupEventVisuals';

export interface MarkupEventLogSessionProps {
  events: AttachmentMarkupEvent[];
  isLast: boolean;
}

export default function MarkupEventLogSession({ events, isLast }: MarkupEventLogSessionProps) {
  if (events.length === 0) {
    return null;
  }

  const summary = summarizeMarkupSession(events);
  const ev = MARKUP_EVENT_VISUALS[summary.iconEventType] ?? MARKUP_EVENT_VISUALS.default;
  const Icon = ev.icon;

  return (
    <div className={cn('flex gap-3', !isLast && 'pb-4')}>
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">{summary.title}</p>
            {summary.subtitle ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{summary.subtitle}</p>
            ) : null}
          </div>
          <EventLogTimestamp createdAt={summary.latestAt} showAbsoluteTimes />
        </div>
      </div>
    </div>
  );
}
