/** Context when opening account view from a PO item row (or similar). */
export interface AccountViewHighlightContext {
  itemId?: number | null;
  itemName?: string | null;
  /** Current PO — open invoices linked to this order sort first. */
  purchaseOrderId?: number | null;
}

export const EMPTY_ACCOUNT_VIEW_CONTEXT: AccountViewHighlightContext = {};
