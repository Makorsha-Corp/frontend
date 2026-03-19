/**
 * Sales order Kanban column grouping.
 * Maps current_status_id to: Pending | Working | Completed
 *
 * For sales, the final stage = "Completed" (by status name from API).
 * When statuses are provided, we resolve by name so it works across workspaces.
 */
export type SalesOrderKanbanColumn = 'pending' | 'working' | 'completed';

export const SALES_KANBAN_COLUMNS: { id: SalesOrderKanbanColumn; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'working', label: 'Working' },
  { id: 'completed', label: 'Completed' },
];

/** Status 1 = Pending (fallback when no statuses) */
const PENDING_STATUS_ID = 1;
/** Status 2, 3 = Approved, In Transit (fallback when no statuses) */
const WORKING_STATUS_IDS = [2, 3];
/** Fallback IDs for completed when statuses not available: Received (4), Completed (8) */
const FALLBACK_COMPLETED_STATUS_IDS = [4, 8];

export interface StatusLike {
  id: number;
  name: string;
}

/**
 * Resolve Kanban column for a sales order status.
 * When statuses are provided, uses status name "Completed" (case-insensitive) for the final column.
 */
export function getSalesOrderKanbanColumn(
  statusId: number,
  statuses?: StatusLike[]
): SalesOrderKanbanColumn {
  if (statuses?.length) {
    const s = statuses.find((x) => x.id === statusId);
    if (s?.name?.toLowerCase() === 'completed') return 'completed';
  }
  if (statusId === PENDING_STATUS_ID) return 'pending';
  if (WORKING_STATUS_IDS.includes(statusId)) return 'working';
  if (FALLBACK_COMPLETED_STATUS_IDS.includes(statusId)) return 'completed';
  return 'pending';
}

/**
 * Returns status IDs that belong to a Kanban column.
 * For 'completed', when statuses provided, returns IDs whose name is "Completed".
 */
export function getStatusIdsForColumn(
  column: SalesOrderKanbanColumn,
  statuses?: StatusLike[]
): number[] {
  if (column === 'completed' && statuses?.length) {
    const completedIds = statuses
      .filter((s) => s.name?.toLowerCase() === 'completed')
      .map((s) => s.id);
    if (completedIds.length) return completedIds;
  }
  switch (column) {
    case 'pending':
      return [PENDING_STATUS_ID];
    case 'working':
      return WORKING_STATUS_IDS;
    case 'completed':
      return FALLBACK_COMPLETED_STATUS_IDS;
    default:
      return [];
  }
}
