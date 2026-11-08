import React from 'react';

import { cn } from '@/lib/utils';
import {
  BATCH_EVENT_FILTER_ALL,
  BATCH_EVENT_LOG_FILTER_OPTIONS,
  type BatchEventLogFilter,
} from '@/lib/batchEventLogFilters';

interface BatchEventLogFilterProps {
  value: BatchEventLogFilter;
  onChange: (value: BatchEventLogFilter) => void;
  counts?: Partial<Record<BatchEventLogFilter, number>>;
  className?: string;
}

const BatchEventLogFilter: React.FC<BatchEventLogFilterProps> = ({
  value,
  onChange,
  counts,
  className,
}) => (
  <div
    className={cn(
      'inline-flex max-w-full shrink-0 items-center overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5',
      className,
    )}
    role="group"
    aria-label="Filter event log"
  >
    {BATCH_EVENT_LOG_FILTER_OPTIONS.map((option) => {
      const isActive = value === option.value;
      const count = counts?.[option.value];
      const showCount = typeof count === 'number' && option.value !== BATCH_EVENT_FILTER_ALL;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors sm:px-3',
            isActive
              ? 'bg-card text-card-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={isActive}
        >
          {option.label}
          {showCount ? (
            <span
              className={cn(
                'tabular-nums',
                isActive ? 'text-muted-foreground' : 'text-muted-foreground/80',
              )}
            >
              {count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default BatchEventLogFilter;
