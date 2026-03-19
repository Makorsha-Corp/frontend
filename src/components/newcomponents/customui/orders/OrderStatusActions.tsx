import React from 'react';
import { Button } from '@/components/ui/button';
import { ORDER_STATUS_WORKFLOW, getNextStatusId } from './orderStatusConstants';
import { ChevronRight, Loader2, Trash2 } from 'lucide-react';

export interface OrderStatusActionsProps {
  currentStatusId: number;
  onStatusChange: (statusId: number) => void;
  isLoading?: boolean;
  /** Optional: statuses from API (for display names). Falls back to ORDER_STATUS_WORKFLOW. */
  statuses?: { id: number; name: string }[];
  /** Optional: called when Delete is clicked */
  onDelete?: () => void;
}

const OrderStatusActions: React.FC<OrderStatusActionsProps> = ({
  currentStatusId,
  onStatusChange,
  isLoading = false,
  statuses = ORDER_STATUS_WORKFLOW,
  onDelete,
}) => {
  const nextStatusId = getNextStatusId(currentStatusId);
  const nextLabel = nextStatusId ? statuses.find((s) => s.id === nextStatusId)?.name ?? `#${nextStatusId}` : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatusId && (
        <Button
          variant="default"
          size="sm"
          disabled={isLoading}
          onClick={() => onStatusChange(nextStatusId)}
          className="bg-brand-primary hover:bg-brand-primary-hover"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Advance to {nextLabel}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          disabled={isLoading}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );
};

export default OrderStatusActions;
