import React from 'react';
import { cn } from '@/lib/utils';
import {
  Check,
  Clock,
  History,
  Package,
  ShieldCheck,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { formatRelativeFromApi } from '@/utils/datetime';
import { initialsOf } from './transferOrderApprovals';

export type TransferOrderEventType =
  | 'created'
  | 'updated'
  | 'completed'
  | 'item_approved'
  | 'item_transferred'
  | 'approver_added'
  | 'approver_removed'
  | 'approved'
  | 'withdrawn'
  | 'required_changed'
  | 'section_confirmed'
  | 'section_unconfirmed';

export interface TransferOrderEvent {
  id: string;
  event_type: TransferOrderEventType;
  description: string;
  created_at: string;
  user_name?: string | null;
  isConfirm?: boolean;
}

const EVENT_VISUALS: Record<
  TransferOrderEventType | 'default',
  { icon: React.ElementType; wrap: string; color: string }
> = {
  created: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  updated: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  completed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  item_approved: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  item_transferred: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600' },
  approver_added: { icon: UserPlus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approver_removed: { icon: UserMinus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approved: { icon: ShieldCheck, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  withdrawn: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  required_changed: { icon: ShieldCheck, wrap: 'bg-muted', color: 'text-muted-foreground' },
  section_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
  section_unconfirmed: { icon: Clock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' },
  default: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

interface ToEventLogRowProps {
  event: TransferOrderEvent;
  isLast: boolean;
}

const ToEventLogRow: React.FC<ToEventLogRowProps> = ({ event, isLast }) => {
  const ev = EVENT_VISUALS[event.event_type] ?? EVENT_VISUALS.default;
  const Icon = ev.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', ev.wrap)}>
          <Icon className={cn('h-4 w-4', ev.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-card-foreground">{event.description}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeFromApi(event.created_at)}
          </span>
        </div>
        {event.user_name && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-semibold">
              {initialsOf(event.user_name)}
            </div>
            <span className="text-xs text-muted-foreground">{event.user_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToEventLogRow;
