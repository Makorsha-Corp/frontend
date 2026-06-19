import {
  Check,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileText,
  History,
  PackageMinus,
  PackagePlus,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface EoEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const EO_EVENT_VISUALS: Record<string, EoEventVisual> = {
  created: { icon: History, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  updated: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
  order_completed: {
    icon: CheckCircle2,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  details_confirmed: {
    icon: Check,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  details_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  items_confirmed: {
    icon: Check,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  items_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  invoice_confirmed: {
    icon: Check,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  invoice_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  invoice_created: {
    icon: FileText,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  item_added: {
    icon: PackagePlus,
    wrap: 'bg-emerald-100 dark:bg-emerald-900/30',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  item_removed: {
    icon: PackageMinus,
    wrap: 'bg-rose-100 dark:bg-rose-900/30',
    color: 'text-rose-600 dark:text-rose-400',
  },
  item_updated: {
    icon: History,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  approver_added: {
    icon: UserPlus,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
  },
  approver_removed: { icon: UserMinus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approved: {
    icon: ShieldCheck,
    wrap: 'bg-brand-primary/10',
    color: 'text-brand-primary',
  },
  approval_withdrawn: {
    icon: X,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  approvals_reset: {
    icon: Clock,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  default: { icon: History, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

export const EO_CONFIRM_EVENT_TYPES = new Set([
  'details_confirmed',
  'details_unconfirmed',
  'items_confirmed',
  'items_unconfirmed',
  'invoice_confirmed',
  'invoice_unconfirmed',
  'approved',
  'approval_withdrawn',
  'approvals_reset',
  'item_added',
  'item_removed',
  'item_updated',
]);
