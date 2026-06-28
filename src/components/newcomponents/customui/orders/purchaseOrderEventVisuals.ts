import {
  Plus,
  Truck,
  CheckCircle2,
  Check,
  X,
  XCircle,
  CircleDashed,
  Building2,
  FileText,
  Edit3,
  StickyNote,
  CheckCircle,
  Package,
  PackagePlus,
  PackageMinus,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

export interface PoEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const PO_EVENT_VISUALS: Record<string, PoEventVisual> = {
  created: { icon: Plus, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  received: { icon: Truck, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  all_received: { icon: CheckCircle2, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approved: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approval_withdrawn: { icon: X, wrap: 'bg-muted', color: 'text-muted-foreground' },
  supplier_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  supplier_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  details_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  details_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  notes_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  notes_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  items_confirmed: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  items_unconfirmed: { icon: CircleDashed, wrap: 'bg-muted', color: 'text-muted-foreground' },
  supplier_updated: {
    icon: Building2,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  invoice_created: {
    icon: FileText,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  invoice_confirmed: {
    icon: CheckCircle2,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  invoice_voided: {
    icon: XCircle,
    wrap: 'bg-red-100 dark:bg-red-900/30',
    color: 'text-red-600 dark:text-red-400',
  },
  invoice_draft_created: {
    icon: FileText,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  invoice_draft_deleted: {
    icon: XCircle,
    wrap: 'bg-muted',
    color: 'text-muted-foreground',
  },
  approvals_reset: {
    icon: ShieldCheck,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  details_updated: {
    icon: Edit3,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  notes_updated: {
    icon: StickyNote,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
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
    icon: Package,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  approver_added: {
    icon: UserPlus,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
  },
  approver_removed: {
    icon: UserMinus,
    wrap: 'bg-muted',
    color: 'text-muted-foreground',
  },
  status_updated: {
    icon: CheckCircle,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  order_completed: {
    icon: CheckCircle2,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  inventory_posted: {
    icon: PackagePlus,
    wrap: 'bg-emerald-100 dark:bg-emerald-900/30',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  approvals_threshold_updated: {
    icon: ShieldCheck,
    wrap: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-600 dark:text-amber-400',
  },
  po_voided: {
    icon: XCircle,
    wrap: 'bg-red-100 dark:bg-red-900/30',
    color: 'text-red-600 dark:text-red-400',
  },
  quantity_correction: {
    icon: Wand2,
    wrap: 'bg-orange-100 dark:bg-orange-900/30',
    color: 'text-orange-600 dark:text-orange-400',
  },
  default: { icon: CheckCircle, wrap: 'bg-muted', color: 'text-muted-foreground' },
};
