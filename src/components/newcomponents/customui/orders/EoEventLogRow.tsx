import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ExpenseOrderEvent as ApiExpenseOrderEvent } from '@/types/expenseOrder';
import { formatRelativeFromApi } from '@/utils/datetime';
import { initialsOf } from './transferOrderApprovals';
import { EO_EVENT_VISUALS } from './expenseOrderEventVisuals';

export interface ExpenseOrderEventDisplay {
  id: string | number;
  event_type: string;
  description: string;
  created_at: string;
  performer_name?: string | null;
  metadata?: ApiExpenseOrderEvent['metadata'];
}

const displayValue = (value: string | null | undefined) => value ?? '—';

interface EoEventLogRowProps {
  event: ExpenseOrderEventDisplay;
  isLast: boolean;
}

const EoEventLogRow: React.FC<EoEventLogRowProps> = ({ event, isLast }) => {
  const [open, setOpen] = useState(false);
  const ev = EO_EVENT_VISUALS[event.event_type] ?? EO_EVENT_VISUALS.default;
  const Icon = ev.icon;
  const changes = event.metadata?.changes ?? [];
  const hasChanges = changes.length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
        {hasChanges ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex items-start justify-between gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group inline-flex max-w-full flex-col items-start gap-0.5 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={open}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="text-sm font-medium text-card-foreground group-hover:underline">
                      {event.description}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                  </span>
                  {!open && (
                    <span className="text-[11px] text-muted-foreground">
                      {changes.length} field{changes.length === 1 ? '' : 's'} — click to expand
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeFromApi(event.created_at)}
              </span>
            </div>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                {changes.map((change) => (
                  <li key={`${change.field}-${change.label}`} className="text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">{change.label}:</span>{' '}
                    <span>{displayValue(change.from_value)}</span>
                    <span className="mx-1 text-muted-foreground/70">→</span>
                    <span className="text-card-foreground">{displayValue(change.to_value)}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-card-foreground">{event.description}</p>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeFromApi(event.created_at)}
            </span>
          </div>
        )}
        {event.performer_name && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {initialsOf(event.performer_name)} · {event.performer_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default EoEventLogRow;
