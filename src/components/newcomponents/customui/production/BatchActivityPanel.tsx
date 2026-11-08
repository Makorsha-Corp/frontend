import React, { useEffect, useMemo, useState } from 'react';
import { History, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetBatchEventsQuery } from '@/features/production/productionApi';
import {
  BATCH_EVENT_FILTER_ALL,
  BATCH_EVENT_LOG_FILTER_OPTIONS,
  countBatchEventsForFilter,
  type BatchEventLogFilter,
} from '@/lib/batchEventLogFilters';

import { buildBatchEventTimeline } from '@/lib/batchEventLogGrouping';

import BatchEventLogFilter from './BatchEventLogFilter';
import BatchEventLogGroupRow from './BatchEventLogGroupRow';
import BatchEventLogRow from './BatchEventLogRow';
import type { BatchEventDisplayContext } from '@/lib/batchEventLogDisplay';

interface BatchActivityPanelProps {
  batchId: number;
  displayContext?: BatchEventDisplayContext;
}

const BatchActivityPanel: React.FC<BatchActivityPanelProps> = ({ batchId, displayContext }) => {
  const [showAbsoluteTimes, setShowAbsoluteTimes] = useState(false);
  const [eventFilter, setEventFilter] = useState<BatchEventLogFilter>(BATCH_EVENT_FILTER_ALL);
  const { data: events = [], isLoading, isError } = useGetBatchEventsQuery(batchId, {
    skip: batchId <= 0,
  });

  useEffect(() => {
    setEventFilter(BATCH_EVENT_FILTER_ALL);
  }, [batchId]);

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<BatchEventLogFilter, number>> = {};
    for (const option of BATCH_EVENT_LOG_FILTER_OPTIONS) {
      counts[option.value] = countBatchEventsForFilter(events, option.value);
    }
    return counts;
  }, [events]);

  const displayEntries = useMemo(
    () => buildBatchEventTimeline(events, eventFilter),
    [events, eventFilter],
  );

  const hasFilteredResults = displayEntries.length > 0;

  return (
    <Card className="shrink-0 overflow-hidden border-border shadow-sm">
      <CardHeader className="gap-3 space-y-0 p-4 pb-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex shrink-0 items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Event Log
          </CardTitle>
          {!isLoading && !isError && events.length > 0 ? (
            <BatchEventLogFilter
              value={eventFilter}
              onChange={setEventFilter}
              counts={filterCounts}
              className="w-full sm:w-auto"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading event log…
          </div>
        ) : isError ? (
          <p className="py-6 text-sm text-muted-foreground">Could not load event log.</p>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <History className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No events yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Changes and step actions on this batch will appear here.
            </p>
          </div>
        ) : !hasFilteredResults ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No events in this category</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try another filter or show all events.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setEventFilter(BATCH_EVENT_FILTER_ALL)}
            >
              Show all
            </Button>
          </div>
        ) : (
          <div className="pr-1">
            {displayEntries.map((entry, index) => {
              const isLast = index === displayEntries.length - 1;
              if (entry.kind === 'group') {
                return (
                  <BatchEventLogGroupRow
                    key={`group-${entry.batchStageLogId}-${entry.events.map((e) => e.id).join('-')}`}
                    events={entry.events}
                    isLast={isLast}
                    showAbsoluteTimes={showAbsoluteTimes}
                    onToggleTimestampDisplay={() => setShowAbsoluteTimes((value) => !value)}
                    displayContext={displayContext}
                  />
                );
              }
              return (
                <BatchEventLogRow
                  key={entry.event.id}
                  event={entry.event}
                  isLast={isLast}
                  showAbsoluteTimes={showAbsoluteTimes}
                  onToggleTimestampDisplay={() => setShowAbsoluteTimes((value) => !value)}
                  displayContext={displayContext}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchActivityPanel;
