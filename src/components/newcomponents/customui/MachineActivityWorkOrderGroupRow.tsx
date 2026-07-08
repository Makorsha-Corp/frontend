import React, { useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGetWorkOrderByIdQuery } from '@/features/workOrders/workOrdersApi';
import { workOrderStatusBadgeClass, workOrderStatusLabel } from '@/pages/newpages/orders/workOrderConstants';
import { formatRelativeFromApi } from '@/utils/datetime';
import type { MachineActivityEvent } from '@/types/machineActivityEvent';
import MachineActivityEventLogRow from './MachineActivityEventLogRow';

interface MachineActivityWorkOrderGroupRowProps {
  workOrderId: number;
  events: MachineActivityEvent[];
  isLast: boolean;
}

const MachineActivityWorkOrderGroupRow: React.FC<MachineActivityWorkOrderGroupRowProps> = ({
  workOrderId,
  events,
  isLast,
}) => {
  const [open, setOpen] = useState(false);
  const { data: order } = useGetWorkOrderByIdQuery(workOrderId);
  const latest = events[0];

  return (
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10">
          <ClipboardList className="h-4 w-4 text-brand-primary" />
        </div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group inline-flex max-w-full flex-col items-start gap-0.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={open}
              >
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-card-foreground group-hover:underline">
                    Work order {order?.work_order_number ?? `#${workOrderId}`}
                  </span>
                  {order && (
                    <Badge variant="outline" className={cn('font-normal', workOrderStatusBadgeClass(order.status))}>
                      {workOrderStatusLabel(order.status)}
                    </Badge>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                      open && 'rotate-180'
                    )}
                  />
                </span>
                {!open && (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {order?.title ? `${order.title} — ` : ''}
                    {events.length} update{events.length === 1 ? '' : 's'} — click to expand
                  </span>
                )}
              </button>
            </CollapsibleTrigger>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeFromApi(latest.created_at)}
            </span>
          </div>
          <CollapsibleContent>
            <div className="mt-2 space-y-3 border-l border-border/60 pl-3">
              {events.map((event, idx) => (
                <MachineActivityEventLogRow key={event.id} event={event} isLast={idx === events.length - 1} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default MachineActivityWorkOrderGroupRow;
