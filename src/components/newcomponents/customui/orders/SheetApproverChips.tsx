import React from 'react';
import { cn } from '@/lib/utils';
import type { WorkOrderApprover } from '@/types/workOrder';
import { avatarColor, initialsOf } from './transferOrderApprovals';

export interface SheetApproverChipsProps {
  approvers: WorkOrderApprover[];
  maxVisible?: number;
  className?: string;
}

const SheetApproverChips: React.FC<SheetApproverChipsProps> = ({
  approvers,
  maxVisible = 4,
  className,
}) => {
  if (approvers.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = approvers.slice(0, maxVisible);
  const overflow = approvers.length - visible.length;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((approver) => (
        <span
          key={approver.id}
          title={`${approver.user_name ?? 'User'} — ${approver.approved ? 'Approved' : 'Pending'}`}
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white',
            approver.approved ? 'ring-2 ring-emerald-500/80' : 'opacity-60 ring-1 ring-border',
            avatarColor(approver.user_id),
          )}
        >
          {initialsOf(approver.user_name)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground">+{overflow}</span>
      )}
    </div>
  );
};

export default SheetApproverChips;
