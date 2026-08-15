import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';
import { avatarColor, initialsOf } from './approvalAvatarUtils';
import type { OrderApproverView } from './orderApprovalTypes';

export interface OrderApproverAvatarProps {
  approver: OrderApproverView;
  currentUserId?: number | null;
}

const OrderApproverAvatar: React.FC<OrderApproverAvatarProps> = ({ approver, currentUserId = null }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
            approver.approved ? avatarColor(approver.user_id) : 'bg-muted-foreground/40 opacity-60'
          )}
        >
          {initialsOf(approver.user_name)}
          {approver.approved && (
            <span className="absolute bottom-0 left-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-600 ring-1 ring-background">
              <Check className="h-1.5 w-1.5 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[14rem]">
        <p className="font-medium">
          {approver.user_name ?? `User #${approver.user_id}`}
          {approver.user_id === currentUserId ? ' (you)' : ''}
        </p>
        {(approver.user_position || approver.user_email) && (
          <p className="text-xs text-muted-foreground">{approver.user_position || approver.user_email}</p>
        )}
        <p className="mt-1 flex items-center gap-1 text-xs">
          {approver.approved ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              Approved
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              Pending
            </>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default OrderApproverAvatar;

