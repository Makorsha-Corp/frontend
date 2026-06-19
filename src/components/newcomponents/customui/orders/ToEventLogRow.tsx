import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { TransferOrderEvent as ApiTransferOrderEvent } from '@/types/transferOrder';
import { formatRelativeFromApi } from '@/utils/datetime';
import { initialsOf } from './transferOrderApprovals';
import {
  Check,
  Clock,
  History,
  Package,
  ShieldCheck,
  UserPlus,
  UserMinus,
} from 'lucide-react';

export type TransferOrderEventType =
  | 'created'
  | 'updated'
  | 'completed'
  | 'order_completed'
  | 'item_approved'
  | 'item_transferred'
  | 'transfer_recorded'
  | 'transfer_cleared'
  | 'approver_added'
  | 'approver_removed'
  | 'approved'
  | 'approval_withdrawn'
  | 'approvals_reset'
  | 'inventory_posted'
  | 'route_confirmed'
  | 'route_unconfirmed'
  | 'items_confirmed'
  | 'items_unconfirmed'
  | 'section_confirmed'
  | 'section_unconfirmed';

export interface TransferOrderEventDisplay {
  id: string | number;
  event_type: TransferOrderEventType | string;
  description: string;
  created_at: string;
  user_name?: string | null;
  metadata?: ApiTransferOrderEvent['metadata'];
}

const EVENT_VISUALS: Record<
  string,
  { icon: React.ElementType; wrap: string; color: string }
> = {
  created: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  updated: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  completed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  order_completed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  inventory_posted: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  item_approved: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  item_transferred: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  transfer_recorded: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  transfer_cleared: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  approver_added: { icon: UserPlus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approver_removed: { icon: UserMinus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approved: { icon: ShieldCheck, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  approval_withdrawn: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  approvals_reset: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  route_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  route_unconfirmed: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  items_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  items_unconfirmed: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  section_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  section_unconfirmed: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  default: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

const displayValue = (value: string | null | undefined) => value ?? '—';

interface ToEventLogRowProps {
  event: TransferOrderEventDisplay;
  isLast: boolean;
}

const ToEventLogRow: React.FC<ToEventLogRowProps> = ({ event, isLast }) => {
  const [open, setOpen] = useState(false);
  const ev = EVENT_VISUALS[event.event_type] ?? EVENT_VISUALS.default;
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
        {event.user_name && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {initialsOf(event.user_name)} · {event.user_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ToEventLogRow;
