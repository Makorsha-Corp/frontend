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
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/20 py-0.5 pl-0.5 pr-1">
      <OrderApproverAvatar approver={approver} currentUserId={currentUserId} />
      <OrderApproveActionButton
        approved={approver.approved}
        onToggle={onToggleMyApproval}
        {...buttonProps}
      />
    </div>
  );
};

export default OrderSelfApproverChip;
