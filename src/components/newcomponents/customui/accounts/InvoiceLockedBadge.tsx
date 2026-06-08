import React, { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const LOCKED_INVOICE_HINT = 'Receiving has started; void is not available.';

const DEFAULT_BADGE_CLASS =
  'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';

export interface InvoiceLockedBadgeProps {
  className?: string;
  iconClassName?: string;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  popoverAlign?: 'start' | 'center' | 'end';
}

const InvoiceLockedBadge: React.FC<InvoiceLockedBadgeProps> = ({
  className,
  iconClassName,
  popoverSide = 'bottom',
  popoverAlign = 'end',
}) => {
  const [hintOpen, setHintOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => setHintOpen(false), 120);
  };

  const openHint = () => {
    cancelScheduledClose();
    setHintOpen(true);
  };

  const toggleHint = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    cancelScheduledClose();
    setHintOpen((open) => !open);
  };

  return (
    <Popover open={hintOpen} onOpenChange={setHintOpen}>
      <PopoverAnchor asChild>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-help',
            DEFAULT_BADGE_CLASS,
            className
          )}
          onMouseEnter={openHint}
          onMouseLeave={scheduleClose}
          onClick={toggleHint}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleHint(event);
            }
          }}
        >
          <Lock className={cn('h-3 w-3 shrink-0', iconClassName)} aria-hidden />
          Locked
        </span>
      </PopoverAnchor>
      <PopoverContent
        side={popoverSide}
        align={popoverAlign}
        className="w-72 p-3"
        onMouseEnter={cancelScheduledClose}
        onMouseLeave={scheduleClose}
      >
        <p className="flex items-start gap-2 text-sm font-medium text-card-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          Invoice locked
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{LOCKED_INVOICE_HINT}</p>
      </PopoverContent>
    </Popover>
  );
};

export default InvoiceLockedBadge;
