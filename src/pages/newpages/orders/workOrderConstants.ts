import type { WorkOrderPriority, WorkOrderStatus, WorkType } from '@/types/workOrder';

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export const WORK_TYPES: WorkType[] = [
  'MAINTENANCE',
  'INSPECTION',
  'INSTALLATION',
  'REPAIR',
  'CALIBRATION',
  'OVERHAUL',
  'FABRICATION',
  'OTHER',
];

export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const WORK_ORDER_STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function workOrderStatusLabel(status: WorkOrderStatus): string {
  return WORK_ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status.replace(/_/g, ' ');
}

export function workTypeLabel(type: WorkType): string {
  return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function priorityLabel(priority: WorkOrderPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function isWorkOrderOpen(status: WorkOrderStatus): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
}
