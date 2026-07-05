import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    icon: CheckCircle2,
  },
  voided: {
    label: 'Voided',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
} as const;

export interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export default InvoiceStatusBadge;
