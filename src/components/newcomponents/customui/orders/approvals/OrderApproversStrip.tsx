import React from 'react';
import OrderApproverAvatar from './ApproverAvatar';
import OrderApproversOverflowBadge from './OrderApproversOverflowBadge';
import OrderSelfApproverChip, { type OrderSelfApproverChipProps } from './OrderSelfApproverChip';
import type { OrderApproverView } from './orderApprovalTypes';

export interface OrderApproversStripProps {
  approvers: OrderApproverView[];
  currentUserId: number | null;
  myApproval?: OrderApproverView;
  emptyMessage?: string;
  showSelfChip?: boolean;
  maxVisible?: number;
  selfChipProps?: Omit<OrderSelfApproverChipProps, 'approver' | 'currentUserId' | 'onToggleMyApproval'>;
  onToggleMyApproval?: () => void;
}

const OrderApproversStrip: React.FC<OrderApproversStripProps> = ({
  approvers,
  currentUserId,
  myApproval,
  emptyMessage = 'No approvers assigned',
  showSelfChip = false,
  maxVisible = 5,
  selfChipProps,
  onToggleMyApproval,
}) => {
  const sortedApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

  if (sortedApprovers.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyMessage}</span>;
  }

  const showSelf =
    showSelfChip && myApproval != null && currentUserId != null && onToggleMyApproval != null;
  const selfSlot = showSelf ? 1 : 0;
  const others = showSelf
    ? sortedApprovers.filter((approver) => approver.user_id !== currentUserId)
    : sortedApprovers;
  const visibleOthers = others.slice(0, Math.max(0, maxVisible - selfSlot));
  const hiddenCount = others.length - visibleOthers.length;

  return (
    <>
      {showSelf ? (
        <OrderSelfApproverChip
          approver={myApproval}
          currentUserId={currentUserId}
          onToggleMyApproval={onToggleMyApproval}
          blocked={false}
          blockedStatus={{ title: '', reason: '', pendingLabels: [] }}
          isBusy={false}
          {...selfChipProps}
        />
      ) : null}
      {visibleOthers.map((approver) => (
        <div key={approver.id} className="flex shrink-0 items-center gap-1">
          <OrderApproverAvatar approver={approver} currentUserId={currentUserId} />
        </div>
      ))}
      {hiddenCount > 0 ? (
        <OrderApproversOverflowBadge
          hiddenCount={hiddenCount}
          approvers={sortedApprovers}
          currentUserId={currentUserId}
        />
      ) : null}
    </>
  );
};

export default OrderApproversStrip;
