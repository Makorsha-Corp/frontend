import type { WorkOrderItemActionType, WorkOrderPriority, WorkOrderStatus } from '@/types/workOrder';

export const WORK_ORDER_ITEM_ACTION_OPTIONS: { value: WorkOrderItemActionType; label: string }[] = [
  { value: 'CONSUME', label: 'Used up' },
  { value: 'INSTALL', label: 'Install' },
  { value: 'REPLACE', label: 'Replace' },
  { value: 'BORROW', label: 'Borrow' },
];

export const WORK_ORDER_ITEM_ACTION_EXPLAINER: Record<WorkOrderItemActionType, string> = {
  INSTALL: "Taken from the source now. Once this work order is marked complete, it's added to the machine's on-hand inventory for good.",
  REPLACE: "The new part leaves the source now. On completion, the old part comes off the machine into the factory's damaged stock, and the new part takes its place.",
  BORROW: 'Taken from the source now, and given right back to that same source once this work order is marked complete — nothing stays on the machine.',
  CONSUME: 'Deducted from the source now and considered used up (e.g. lubricant, cleaning supplies) — nothing is added to or returned from the machine.',
};

export function workOrderItemActionLabel(actionType: WorkOrderItemActionType): string {
  return WORK_ORDER_ITEM_ACTION_OPTIONS.find((o) => o.value === actionType)?.label ?? actionType;
}

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'VOIDED',
];

export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const WORK_ORDER_STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'VOIDED', label: 'Voided' },
];

export function workOrderStatusLabel(status: WorkOrderStatus): string {
  return WORK_ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status.replace(/_/g, ' ');
}

export function priorityLabel(priority: WorkOrderPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function isWorkOrderOpen(status: WorkOrderStatus): boolean {
  return status !== 'COMPLETED' && status !== 'VOIDED';
}

export function workOrderStatusBadgeClass(status: WorkOrderStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'status-badge status-badge--confirmed';
    case 'VOIDED':
      return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400';
    case 'IN_PROGRESS':
      return 'status-badge status-badge--unconfirmed';
    case 'DRAFT':
      return 'border-slate-400/45 bg-slate-500/10 text-slate-700 dark:border-slate-500/50 dark:bg-slate-500/15 dark:text-slate-300';
    default:
      return 'text-muted-foreground';
  }
}

export function workOrderPriorityBadgeClass(priority: WorkOrderPriority): string {
  switch (priority) {
    case 'URGENT':
      return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400';
    case 'HIGH':
      return 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400';
    case 'LOW':
      return 'border-border/80 bg-muted/50 text-muted-foreground';
    default:
      return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400';
  }
}

export function workOrderPriorityBadgeLabel(priority: WorkOrderPriority): string {
  return priority === 'MEDIUM' ? 'MED' : priority;
}
