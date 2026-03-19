/**
 * Order status workflow constants
 * Used for Purchase, Transfer, Expense, and Sales orders.
 * Work orders use a separate status enum (see workOrder types).
 */

export const ORDER_STATUS_WORKFLOW = [
  { id: 1, name: 'Pending', label: 'Pending' },
  { id: 2, name: 'Approved', label: 'Approved' },
  { id: 3, name: 'In Transit', label: 'In Transit' },
  { id: 4, name: 'Received', label: 'Received' },
] as const;

export type OrderStatusId = (typeof ORDER_STATUS_WORKFLOW)[number]['id'];

export const getNextStatusId = (currentId: number): number | null => {
  const idx = ORDER_STATUS_WORKFLOW.findIndex((s) => s.id === currentId);
  if (idx < 0 || idx >= ORDER_STATUS_WORKFLOW.length - 1) return null;
  return ORDER_STATUS_WORKFLOW[idx + 1].id;
};

export const getStatusNameById = (id: number): string => {
  const s = ORDER_STATUS_WORKFLOW.find((x) => x.id === id);
  return s?.name ?? `#${id}`;
};
