import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Power,
  Wrench,
  Package,
  PackagePlus,
  PackageMinus,
  Truck,
  ClipboardList,
  ShoppingCart,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';

export interface MachineActivityEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const MACHINE_ACTIVITY_EVENT_VISUALS: Record<string, MachineActivityEventVisual> = {
  created: { icon: Plus, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  updated: { icon: Pencil, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  deactivated: { icon: Trash2, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  status_updated: { icon: Play, wrap: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  maintenance_logged: { icon: Wrench, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  maintenance_updated: { icon: Wrench, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  maintenance_removed: { icon: Trash2, wrap: 'bg-muted', color: 'text-muted-foreground' },
  item_added: { icon: PackagePlus, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  item_updated: { icon: Package, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  item_removed: { icon: PackageMinus, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  inventory_adjusted: { icon: RotateCcw, wrap: 'bg-muted', color: 'text-muted-foreground' },
  transfer_in: { icon: Truck, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  transfer_out: { icon: Truck, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  ledger_reconciled: { icon: RotateCcw, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  purchase_received: { icon: ShoppingCart, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  work_order_completed: { icon: ClipboardList, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  work_order_item_used: { icon: ClipboardList, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  item_installed: { icon: PackagePlus, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  item_replaced: { icon: PackagePlus, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  item_replaced_removed: { icon: PackageMinus, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  item_borrowed_returned: { icon: RotateCcw, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  consumption: { icon: PackageMinus, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  consumption_reversed: { icon: RotateCcw, wrap: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
  default: { icon: Pause, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

/** Status-specific icons when event_type is status_updated */
export const STATUS_EVENT_VISUALS: Record<string, MachineActivityEventVisual> = {
  RUNNING: { icon: Play, wrap: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  IDLE: { icon: Pause, wrap: 'bg-muted', color: 'text-muted-foreground' },
  OFF: { icon: Power, wrap: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  MAINTENANCE: { icon: Wrench, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
};

export function resolveMachineActivityVisual(
  eventType: string,
  status?: string | null
): MachineActivityEventVisual {
  if (eventType === 'status_updated' && status) {
    return STATUS_EVENT_VISUALS[status] ?? MACHINE_ACTIVITY_EVENT_VISUALS.status_updated;
  }
  return MACHINE_ACTIVITY_EVENT_VISUALS[eventType] ?? MACHINE_ACTIVITY_EVENT_VISUALS.default;
}
