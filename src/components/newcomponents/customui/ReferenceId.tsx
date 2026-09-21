import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const referenceIdVariants = cva('font-reference tabular-nums tracking-tight', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      inherit: '',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
    },
  },
  defaultVariants: {
    size: 'xs',
    tone: 'muted',
    weight: 'normal',
  },
});

export interface ReferenceIdProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof referenceIdVariants> {
  selectAll?: boolean;
}

function ReferenceId({
  className,
  size,
  tone,
  weight,
  selectAll = false,
  ...props
}: ReferenceIdProps) {
  return (
    <span
      className={cn(
        referenceIdVariants({ size, tone, weight }),
        selectAll && 'select-all',
        className
      )}
      {...props}
    />
  );
}

export { ReferenceId, referenceIdVariants };
