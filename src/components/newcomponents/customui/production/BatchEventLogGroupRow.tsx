import React, { useMemo } from 'react';
import { CircleDot } from 'lucide-react';

import EventLogTimestamp from '@/components/newcomponents/customui/EventLogTimestamp';
import { cn } from '@/lib/utils';
import {
  buildBatchEventChangeRow,
  type BatchEventDisplayContext,
} from '@/lib/batchEventLogDisplay';
import { buildBatchEventGroupTitle } from '@/lib/batchEventLogGrouping';
import type { ProductionBatchEvent } from '@/types/production';

interface BatchEventLogGroupRowProps {
  events: ProductionBatchEvent[];
  isLast: boolean;
  showAbsoluteTimes?: boolean;
  onToggleTimestampDisplay?: () => void;
  displayContext?: BatchEventDisplayContext;
}

const BatchEventLogGroupRow: React.FC<BatchEventLogGroupRowProps> = ({
  events,
  isLast,
  showAbsoluteTimes = false,
  onToggleTimestampDisplay,
  displayContext = {},
}) => {
  const headline = useMemo(() => buildBatchEventGroupTitle(events), [events]);

  const lines = useMemo(
    () =>
      events.map((event) => {
        const change = buildBatchEventChangeRow(event, displayContext);
        return {
          id: event.id,
          label: change?.label ?? 'Update',
          value: change?.value ?? event.description,
          createdAt: event.created_at,
        };
      }),
    [events, displayContext],
  );

  const userName = events.find((e) => e.user_name)?.user_name;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <CircleDot className="h-4 w-4 text-muted-foreground" />
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        <p className="text-sm font-medium text-card-foreground">{headline}</p>
        <dl className="mt-2 space-y-1 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs">
          {lines.map((line) => (
            <div key={line.id} className="flex items-start gap-2">
              <dt className="shrink-0 text-muted-foreground">{line.label}</dt>
              <dd className="min-w-0 flex-1 text-right font-medium text-foreground break-words">
                {line.value}
              </dd>
              <span className="shrink-0">
                <EventLogTimestamp
                  createdAt={line.createdAt}
                  showAbsoluteTimes={showAbsoluteTimes}
                  onToggle={onToggleTimestampDisplay}
                />
              </span>
            </div>
          ))}
        </dl>
        {userName ? <p className="mt-1 text-xs text-muted-foreground">{userName}</p> : null}
      </div>
    </div>
  );
};

export default BatchEventLogGroupRow;
