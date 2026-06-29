import {
  Plus,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Truck,
  Calendar,
  RefreshCw,
  Edit3,
  Package,
  CreditCard,
  Lock,
  Unlock,
  type LucideIcon,
} from 'lucide-react';

export interface InvoiceEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const INVOICE_EVENT_VISUALS: Record<string, InvoiceEventVisual> = {
  created: {
    icon: Plus,
    wrap: 'bg-brand-primary/10',
    color: 'text-brand-primary',
  },
  confirmed: {
    icon: CheckCircle2,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  reverted_to_draft: {
    icon: RotateCcw,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  voided: {
    icon: XCircle,
    wrap: 'bg-red-100 dark:bg-red-900/30',
    color: 'text-red-600 dark:text-red-400',
  },
  receiving_started_set: {
    icon: Truck,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  due_date_changed: {
    icon: Calendar,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  items_synced: {
    icon: RefreshCw,
    wrap: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-600 dark:text-blue-400',
  },
  item_manually_updated: {
    icon: Edit3,
    wrap: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-600 dark:text-blue-400',
  },
  allow_payments_changed: {
    icon: Unlock,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
  },
  payment_lock_changed: {
    icon: Lock,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  payment_recorded: {
    icon: CreditCard,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
  },
  payment_voided: {
    icon: CreditCard,
    wrap: 'bg-rose-100 dark:bg-rose-900/30',
    color: 'text-rose-600 dark:text-rose-400',
  },
  default: {
    icon: Package,
    wrap: 'bg-muted',
    color: 'text-muted-foreground',
  },
};
