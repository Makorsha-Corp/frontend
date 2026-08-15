import React from 'react';
import { Check, Clock } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import OrderApproverAvatar from './ApproverAvatar';
import type { OrderApproverView } from './orderApprovalTypes';

export interface OrderApproversOverflowBadgeProps {
  hiddenCount: number;
  approvers: OrderApproverView[];
  currentUserId?: number | null;
}

const OrderApproversOverflowBadge: React.FC<OrderApproversOverflowBadgeProps> = ({
  hiddenCount,
  approvers,
  currentUserId = null,
}) => {
  if (hiddenCount <= 0) return null;

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5',
            'border border-border/70 bg-muted/30 text-xs font-medium text-muted-foreground',
            'transition-colors hover:bg-muted/50 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label={`${hiddenCount} more approvers — hover to view all`}
        >
          +{hiddenCount}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-72 border-border bg-popover p-3 text-popover-foreground"
      >
        <p className="mb-2 text-xs font-semibold text-card-foreground">All approvers</p>
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {approvers.map((approver) => (
            <li key={approver.id} className="flex items-center gap-2">
              <OrderApproverAvatar approver={approver} currentUserId={currentUserId} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {approver.user_name ?? `User #${approver.user_id}`}
                  {approver.user_id === currentUserId ? ' (you)' : ''}
                </p>
                {(approver.user_position || approver.user_email) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {approver.user_position || approver.user_email}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 text-xs',
                  approver.approved ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
              >
                {approver.approved ? (
                  <>
                    <Check className="h-3 w-3" />
                    Approved
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Pending
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
};

export default OrderApproversOverflowBadge;
