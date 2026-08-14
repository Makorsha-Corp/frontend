/** Shared constants for order list/detail layouts across all order types */
export const ORDER_LIST_WIDTH = 360;

/** Fixed height for navigator + detail sub-headers that sit on the same row */
export const ORDER_PANEL_HEADER_CLASS =
  'shrink-0 flex h-14 min-h-14 w-full items-center border-b border-border bg-card';

/** Scroll shell for order detail panels (no horizontal padding — bar bleeds full width). */
export const ORDER_DETAIL_SCROLL_CLASS = 'flex-1 min-h-0 overflow-y-auto';

/** Padded body below the approvals bar inside detail scroll. */
export const ORDER_DETAIL_BODY_CLASS = 'px-6 pb-6 pt-4 space-y-4';

/** Padded body with looser vertical rhythm (purchase / sales orders). */
export const ORDER_DETAIL_BODY_CLASS_LOOSE = 'px-6 pb-6 pt-4 space-y-6';

/** Full-width approvals bar as first child of ORDER_DETAIL_SCROLL_CLASS. */
export const ORDER_APPROVALS_BAR_CLASS =
  'shrink-0 flex h-14 min-h-14 w-full items-center border-b border-border bg-card flex-nowrap gap-x-4 px-6 scroll-mt-6';

/** @deprecated Used by legacy two-column detail layout. New layout is stacked (details top, items below). */
export const ORDER_OVERVIEW_FLEX = 1;
export const ORDER_ITEMS_FLEX = 1;
