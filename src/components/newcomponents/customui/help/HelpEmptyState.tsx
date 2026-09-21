import React from 'react';
import { LifeBuoy, MessageSquare, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { HelpTicketType } from '@/types/helpTicket';

import { getHelpCopy } from './helpCopy';

interface HelpEmptyStateProps {
  type: HelpTicketType;
  onCreate: () => void;
  compact?: boolean;
}

const ICONS: Record<HelpTicketType, LucideIcon> = {
  support: LifeBuoy,
  feedback: MessageSquare,
};

const HelpEmptyState: React.FC<HelpEmptyStateProps> = ({ type, onCreate, compact = false }) => {
  const copy = getHelpCopy(type);
  const Icon = ICONS[type];

  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center px-4 py-10 text-center'
          : 'flex flex-col items-center px-6 py-16 text-center'
      }
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/25">
        <Icon className="h-6 w-6 text-brand-primary" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-card-foreground">{copy.emptyHeadline}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy.emptySubtitle}</p>
      <Button type="button" className="mt-5" onClick={onCreate}>
        {copy.emptyCta}
      </Button>
    </div>
  );
};

export default HelpEmptyState;
