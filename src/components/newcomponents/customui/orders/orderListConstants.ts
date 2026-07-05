/** Shared constants for order list/detail layouts across all order types */
export const ORDER_LIST_WIDTH = 360;

/** Fixed height for navigator + detail sub-headers that sit on the same row */
export const ORDER_PANEL_HEADER_CLASS =
  'shrink-0 flex h-14 min-h-14 items-center border-b border-border bg-card';

/** @deprecated Used by legacy two-column detail layout. New layout is stacked (details top, items below). */
export const ORDER_OVERVIEW_FLEX = 1;
export const ORDER_ITEMS_FLEX = 1;
