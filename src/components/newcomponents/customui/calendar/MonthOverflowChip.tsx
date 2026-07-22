import React from 'react';
import { cn } from '@/lib/utils';

export interface MonthOverflowChipProps {
  count: number;
  chipText: string;
  chipPadding: string;
}

const MonthOverflowChip: React.FC<MonthOverflowChipProps> = ({
  count,
  chipText,
  chipPadding,
}) => {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded border border-border/60 bg-muted/40 font-medium leading-tight text-muted-foreground',
        chipPadding,
        chipText,
      )}
    >
      +{count}
    </span>
  );
};

export default MonthOverflowChip;
