import React from 'react';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountInvoice, InvoiceEvent } from '@/types/accountInvoice';
import InvoiceEventLogRow from './InvoiceEventLogRow';

import { cn } from '@/lib/utils';

interface InvoiceEventLogCardProps {
  events: InvoiceEvent[];
  invoice: AccountInvoice;
  embedded?: boolean;
}

function formatDate(d: string | null | undefined): string {
  return d ? new Date(d).toLocaleDateString() : '—';
}

const InvoiceEventLogCard: React.FC<InvoiceEventLogCardProps> = ({
  events,
  invoice,
  embedded = false,
}) => {
  return (
    <Card
      className={cn(
        'flex max-h-[min(33.6rem,52.5vh)] flex-col overflow-hidden',
        embedded && 'border-0 bg-transparent shadow-none'
      )}
    >
      <CardHeader className="shrink-0 p-4 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Invoice logs
            <Badge variant="outline" className="ml-1 font-normal">
              {events.length}
            </Badge>
          </CardTitle>
          <p className="shrink-0 text-xs text-muted-foreground">
            Created {formatDate(invoice.created_at)} · Updated{' '}
            {formatDate(invoice.updated_at ?? invoice.created_at)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <History className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, idx) => (
              <InvoiceEventLogRow
                key={event.id}
                event={event}
                isLast={idx === events.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceEventLogCard;
