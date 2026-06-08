import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AlertCircle, Pencil } from 'lucide-react';

export interface PoEditOrderItemsButtonProps {
  itemsConfirmed: boolean;
  onEdit: () => void;
  className?: string;
  variant?: 'outline' | 'default';
}

const PoEditOrderItemsButton: React.FC<PoEditOrderItemsButtonProps> = ({
  itemsConfirmed,
  onEdit,
  className,
  variant = 'outline',
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleClick = () => {
    if (itemsConfirmed) {
      setPopoverOpen(true);
      return;
    }
    onEdit();
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant={variant}
          size="sm"
          className={cn('h-8 shrink-0', itemsConfirmed && 'opacity-60', className)}
          onClick={handleClick}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit Items and Prices
        </Button>
      </PopoverAnchor>
      {itemsConfirmed ? (
        <PopoverContent side="bottom" align="end" className="w-72 space-y-2 p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-card-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            Order items are confirmed
          </p>
          <p className="text-xs text-muted-foreground">
            Unconfirm this section to change line items, quantities, or prices.
          </p>
        </PopoverContent>
      ) : null}
    </Popover>
  );
};

export default PoEditOrderItemsButton;
