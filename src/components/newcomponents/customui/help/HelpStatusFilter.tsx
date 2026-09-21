import React from 'react';

import { cn } from '@/lib/utils';
import type { HelpTicketStatus } from '@/types/helpTicket';

import { STATUS_FILTER_ALL, type HelpStatusFilter } from './helpCopy';

const STATUS_OPTIONS: { value: HelpStatusFilter; label: string }[] = [
  { value: STATUS_FILTER_ALL, label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'opened', label: 'Opened' },
  { value: 'closed', label: 'Closed' },
];

interface HelpStatusFilterProps {
  value: HelpStatusFilter;
  onChange: (value: HelpStatusFilter) => void;
  className?: string;
}

const HelpStatusFilter: React.FC<HelpStatusFilterProps> = ({ value, onChange, className }) => (
  <div
    className={cn(
      'inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-muted/40 p-0.5',
      className,
    )}
    role="group"
    aria-label="Filter by status"
  >
    {STATUS_OPTIONS.map((option) => {
      const isActive = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value as HelpTicketStatus | typeof STATUS_FILTER_ALL)}
          className={cn(
            'inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors',
            isActive
              ? 'bg-card text-card-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={isActive}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default HelpStatusFilter;
