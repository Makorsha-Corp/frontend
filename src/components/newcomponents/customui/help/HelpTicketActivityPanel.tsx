import React, { useState } from 'react';
import { History, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetHelpTicketEventsQuery } from '@/features/helpTickets/helpTicketsApi';

import HelpTicketEventLogRow from './HelpTicketEventLogRow';

interface HelpTicketActivityPanelProps {
  ticketId: number;
}

const HelpTicketActivityPanel: React.FC<HelpTicketActivityPanelProps> = ({ ticketId }) => {
  const [showAbsoluteTimes, setShowAbsoluteTimes] = useState(false);
  const { data: events = [], isLoading, isError } = useGetHelpTicketEventsQuery(ticketId, {
    skip: ticketId <= 0,
  });

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity…
          </div>
        ) : isError ? (
          <p className="py-6 text-sm text-muted-foreground">Could not load activity.</p>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <History className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1">
            {events.map((event, index) => (
              <HelpTicketEventLogRow
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
                showAbsoluteTimes={showAbsoluteTimes}
                onToggleTimestampDisplay={() => setShowAbsoluteTimes((value) => !value)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HelpTicketActivityPanel;
