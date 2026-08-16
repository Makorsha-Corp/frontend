import {
  Plus,
  Check,
  X,
  CircleDashed,
  CheckCircle2,
  CheckCircle,
  UserPlus,
  UserMinus,
  ShieldCheck,
  CreditCard,
  FileText,
  Paperclip,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export interface SoEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const SO_EVENT_VISUALS: Record<string, SoEventVisual> = {
  created: { icon: Plus, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  order_info_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  order_info_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  items_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  items_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  invoice_draft_created: { icon: FileText, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  invoice_draft_deleted: { icon: Trash2, wrap: 'bg-muted', color: 'text-muted-foreground' },
  invoice_confirmed: { icon: CheckCircle2, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approvals_reset: { icon: ShieldCheck, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  approver_added: { icon: UserPlus, wrap: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
  approver_removed: { icon: UserMinus, wrap: 'bg-muted', color: 'text-muted-foreground' },
  approved: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approval_withdrawn: { icon: X, wrap: 'bg-muted', color: 'text-muted-foreground' },
  order_completed: { icon: CheckCircle2, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  payment_status_synced: { icon: CreditCard, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  attachment_added: { icon: Paperclip, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  attachment_removed: { icon: Trash2, wrap: 'bg-muted', color: 'text-muted-foreground' },
  default: { icon: CheckCircle, wrap: 'bg-muted', color: 'text-muted-foreground' },
};
