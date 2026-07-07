import React from 'react';
import { cn } from '@/lib/utils';

export interface DetailInsetSectionProps {
  children: React.ReactNode;
  className?: string;
}

/** Tier 3 nested block — surface-inset on bg-card canvas (light + dark). */
export function DetailInsetSection({ children, className }: DetailInsetSectionProps) {
  return <div className={cn('surface-inset px-4 py-4', className)}>{children}</div>;
}
