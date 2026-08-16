import React from 'react';
import OrderApproverAvatar from './ApproverAvatar';
import OrderApproveActionButton, { type OrderApproveActionButtonProps } from './OrderApproveActionButton';
import type { OrderApproverView } from './orderApprovalTypes';

export interface OrderSelfApproverChipProps
  extends Omit<OrderApproveActionButtonProps, 'approved' | 'onToggle'> {
  approver: OrderApproverView;
  currentUserId: number;
  onToggleMyApproval: () => void;
}

const OrderSelfApproverChip: React.FC<OrderSelfApproverChipProps> = ({
  approver,
  currentUserId,
  onToggleMyApproval,
  ...buttonProps
}) => {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 py-0.5 pl-0.5 pr-0.5">
      <OrderApproverAvatar approver={approver} currentUserId={currentUserId} />
      <div className="h-4 w-px shrink-0 bg-border/80" aria-hidden />
      <OrderApproveActionButton
        approved={approver.approved}
        onToggle={onToggleMyApproval}
        {...buttonProps}
      />
    </div>
  );
};

export default OrderSelfApproverChip;
