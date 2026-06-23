import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useGetTransferOrderItemsQuery, useGetTransferOrderApproversQuery } from '@/features/transferOrders/transferOrdersApi';
import type { TransferOrder } from '@/types/transferOrder';
import {
  deriveTransferOrderStageWithItems,
  trStageBadgeClassName,
} from './transferOrderMilestones';

interface TransferOrderListRowProps {
  order: TransferOrder;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  routeLabel: React.ReactNode;
  formatDate: (d: string | null | undefined) => string;
}

function ApprovalSummaryBadge({ orderId }: { orderId: number }) {
  const { data } = useGetTransferOrderApproversQuery(orderId);
  const approverCount = data?.approvers.length ?? 0;
  if (approverCount === 0) return null;
  const approvalSummary = data!.summary;
  const met = approvalSummary.met;
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[11px]',
        met
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      )}
    >
      {approvalSummary.approved_count}/{approvalSummary.required} approved
    </span>
  );
}

const TransferOrderListRow: React.FC<TransferOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  onDelete,
  routeLabel,
  formatDate,
}) => {
  const { data: items = [] } = useGetTransferOrderItemsQuery(order.id);
  const itemCount = items.length;
  const stageName = deriveTransferOrderStageWithItems(order, items);

  const chipClass =
    'inline-flex items-center bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[11px]';

  return (
    <div
      className={cn(
        'flex w-full transition-colors',
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-card-foreground truncate">{order.transfer_number}</span>
          <Badge
            variant="secondary"
            className={cn('text-[11px] shrink-0 font-medium', trStageBadgeClassName(stageName))}
          >
            {stageName}
          </Badge>
        </div>

        <div className="mt-1 min-w-0 text-sm text-muted-foreground">{routeLabel}</div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={chipClass}>{formatDate(order.created_at)}</span>
          <span className={chipClass}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
          <ApprovalSummaryBadge orderId={order.id} />
        </div>
      </button>

      {onDelete && (
        <div className="flex shrink-0 items-center pr-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete transfer order"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransferOrderListRow;
