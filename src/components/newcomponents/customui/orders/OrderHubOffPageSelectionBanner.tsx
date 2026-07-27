import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderHubOffPageSelectionBannerProps {
  orderLabel: string;
  className?: string;
}

const OrderHubOffPageSelectionBanner: React.FC<OrderHubOffPageSelectionBannerProps> = ({
  orderLabel,
  className,
}) => (
  <div
    className={cn(
      'shrink-0 flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground',
      className,
    )}
    role="status"
  >
    <Info className="h-4 w-4 shrink-0" aria-hidden />
    <span>
      <span className="font-medium text-foreground">{orderLabel}</span> is not on the current
      filtered page.
    </span>
  </div>
);

export default OrderHubOffPageSelectionBanner;
