/** RTK cache tags for order hub list/stats vs legacy list vs entity detail. */

export const PURCHASE_ORDER_LIST_TAG = { type: 'PurchaseOrder' as const, id: 'LIST' as const };
export const PURCHASE_ORDER_HUB_LIST_TAG = { type: 'PurchaseOrder' as const, id: 'HUB_LIST' as const };
export const PURCHASE_ORDER_HUB_STATS_TAG = { type: 'PurchaseOrder' as const, id: 'HUB_STATS' as const };

export const EXPENSE_ORDER_LIST_TAG = { type: 'ExpenseOrder' as const, id: 'LIST' as const };
export const EXPENSE_ORDER_HUB_LIST_TAG = { type: 'ExpenseOrder' as const, id: 'HUB_LIST' as const };
export const EXPENSE_ORDER_HUB_STATS_TAG = { type: 'ExpenseOrder' as const, id: 'HUB_STATS' as const };

export const TRANSFER_ORDER_LIST_TAG = { type: 'TransferOrder' as const, id: 'LIST' as const };
export const TRANSFER_ORDER_HUB_LIST_TAG = { type: 'TransferOrder' as const, id: 'HUB_LIST' as const };
export const TRANSFER_ORDER_HUB_STATS_TAG = { type: 'TransferOrder' as const, id: 'HUB_STATS' as const };

export const purchaseOrderListCacheTags = [
  PURCHASE_ORDER_LIST_TAG,
  PURCHASE_ORDER_HUB_LIST_TAG,
  PURCHASE_ORDER_HUB_STATS_TAG,
];

export const expenseOrderListCacheTags = [
  EXPENSE_ORDER_LIST_TAG,
  EXPENSE_ORDER_HUB_LIST_TAG,
  EXPENSE_ORDER_HUB_STATS_TAG,
];

export const transferOrderListCacheTags = [
  TRANSFER_ORDER_LIST_TAG,
  TRANSFER_ORDER_HUB_LIST_TAG,
  TRANSFER_ORDER_HUB_STATS_TAG,
];

export function purchaseOrderCacheTagsForMutation(id: number) {
  return [{ type: 'PurchaseOrder' as const, id }, ...purchaseOrderListCacheTags];
}

export function expenseOrderCacheTagsForMutation(id: number) {
  return [{ type: 'ExpenseOrder' as const, id }, ...expenseOrderListCacheTags];
}

export function transferOrderCacheTagsForMutation(id: number) {
  return [{ type: 'TransferOrder' as const, id }, ...transferOrderListCacheTags];
}
