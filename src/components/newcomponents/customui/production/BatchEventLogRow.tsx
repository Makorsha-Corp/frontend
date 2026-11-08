import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, CircleDot, History, Play, SkipForward, Trash2 } from 'lucide-react';

import EventLogTimestamp from '@/components/newcomponents/customui/EventLogTimestamp';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  batchEventHasDetails,
  buildBatchEventDetailRows,
  buildBatchEventSummary,
  buildBatchEventTitle,
  type BatchEventDisplayContext,
} from '@/lib/batchEventLogDisplay';
import type { ProductionBatchEvent } from '@/types/production';

const EVENT_VISUALS: Record<string, { icon: React.ElementType; wrap: string; color: string }> = {
  batch_created: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  batch_deleted: { icon: Trash2, wrap: 'bg-destructive/10', color: 'text-destructive' },
  batch_started: { icon: Play, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  batch_returned_to_draft: { icon: History, wrap: 'bg-violet-500/10', color: 'text-violet-700 dark:text-violet-300' },
  batch_completed: { icon: Check, wrap: 'bg-emerald-500/15', color: 'text-emerald-700 dark:text-emerald-300' },
  batch_cancelled: { icon: Trash2, wrap: 'bg-muted', color: 'text-muted-foreground' },
  step_started: { icon: Play, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  step_finished: { icon: Check, wrap: 'bg-emerald-500/15', color: 'text-emerald-700 dark:text-emerald-300' },
  step_skipped: { icon: SkipForward, wrap: 'bg-amber-500/10', color: 'text-amber-800 dark:text-amber-200' },
  item_expected_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  item_actual_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  condition_actual_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  step_output_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  step_input_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  step_waste_changed: { icon: CircleDot, wrap: 'bg-muted', color: 'text-muted-foreground' },
  finished_goods_posted: { icon: CircleDot, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  default: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

interface BatchEventLogRowProps {
  event: ProductionBatchEvent;
  isLast: boolean;
  showAbsoluteTimes?: boolean;
  onToggleTimestampDisplay?: () => void;
  displayContext?: BatchEventDisplayContext;
}

const BatchEventLogRow: React.FC<BatchEventLogRowProps> = ({
  event,
  isLast,
  showAbsoluteTimes = false,
  onToggleTimestampDisplay,
  displayContext = {},
}) => {
  const [expanded, setExpanded] = useState(false);
  const visual = EVENT_VISUALS[event.event_type] ?? EVENT_VISUALS.default;
  const Icon = visual.icon;

  const summary = useMemo(
    () => buildBatchEventSummary(event, displayContext),
    [event, displayContext]
  );
  const detailRows = useMemo(
    () => buildBatchEventDetailRows(event, displayContext),
    [event, displayContext]
  );
  const canExpand = batchEventHasDetails(event, displayContext);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', visual.wrap)}>
          <Icon className={cn('h-4 w-4', visual.color)} />
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground">{buildBatchEventTitle(event)}</p>
            {summary ? (
              <p className="mt-0.5 text-xs text-foreground/80 tabular-nums">{summary}</p>
            ) : null}
            {event.user_name ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.user_name}</p>
            ) : null}
            {canExpand ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
              >
                Details
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
                />
              </Button>
            ) : null}
            {expanded && detailRows.length > 0 ? (
              <dl className="mt-2 space-y-1 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs">
                {detailRows.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                    <dd className="min-w-0 flex-1 text-right font-medium text-foreground break-words">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
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

export default BatchEventLogRow;
