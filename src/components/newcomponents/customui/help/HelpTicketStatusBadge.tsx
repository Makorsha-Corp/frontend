import React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HelpTicketStatus } from '@/types/helpTicket';

function helpTicketStatusBadgeClass(status: HelpTicketStatus): string {
  if (status === 'pending') {
    return 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400';
  }
  if (status === 'opened') {
    return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  }
  return 'border-transparent bg-muted text-muted-foreground';
}

type HelpTicketStatusBadgeSize = 'default' | 'toolbar';

const SIZE_CLASS: Record<HelpTicketStatusBadgeSize, string> = {
  default: 'px-2.5 py-0.5 text-xs',
  toolbar: 'inline-flex h-9 items-center px-2.5 text-xs',
};

interface HelpTicketStatusBadgeProps {
  status: HelpTicketStatus;
  size?: HelpTicketStatusBadgeSize;
  className?: string;
}

const HelpTicketStatusBadge: React.FC<HelpTicketStatusBadgeProps> = ({
  status,
  size = 'default',
  className,
}) => (
  <Badge
    variant="outline"
    className={cn('capitalize', SIZE_CLASS[size], helpTicketStatusBadgeClass(status), className)}
  >
    {status}
  </Badge>
);

export default HelpTicketStatusBadge;
