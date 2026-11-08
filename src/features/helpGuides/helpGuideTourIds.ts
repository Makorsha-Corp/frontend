/** Stable ids for help tours (align with Linear MAK-158+ walk issues). */
export const HELP_GUIDE_TOUR_ID = {
  ordersOverview: 'orders-overview',
  /** Whole purchase hub: list + sample detail in one run */
  purchaseOrders: 'purchase-orders',
  /** Whole transfer hub */
  transferOrders: 'transfer-orders',
  /** Whole expense hub */
  expenseOrders: 'expense-orders',
  /** Whole work orders tab */
  workOrders: 'work-orders',
  /** @deprecated Split tours — kept for clearing legacy seen state on replay */
  purchaseOrderList: 'purchase-order-list',
  purchaseOrderDetail: 'purchase-order-detail',
  transferOrderList: 'transfer-order-list',
  transferOrderDetail: 'transfer-order-detail',
  expenseOrderList: 'expense-order-list',
  expenseOrderDetail: 'expense-order-detail',
  workOrderList: 'work-order-list',
  workOrderDetail: 'work-order-detail',
} as const;

/** Legacy list+detail ids cleared when replaying a combined hub tour. */
export const HELP_GUIDE_HUB_TOUR_LEGACY_IDS: Partial<
  Record<HelpGuideTourId, readonly [HelpGuideTourId, HelpGuideTourId]>
> = {
  [HELP_GUIDE_TOUR_ID.purchaseOrders]: [
    HELP_GUIDE_TOUR_ID.purchaseOrderList,
    HELP_GUIDE_TOUR_ID.purchaseOrderDetail,
  ],
  [HELP_GUIDE_TOUR_ID.transferOrders]: [
    HELP_GUIDE_TOUR_ID.transferOrderList,
    HELP_GUIDE_TOUR_ID.transferOrderDetail,
  ],
  [HELP_GUIDE_TOUR_ID.expenseOrders]: [
    HELP_GUIDE_TOUR_ID.expenseOrderList,
    HELP_GUIDE_TOUR_ID.expenseOrderDetail,
  ],
  [HELP_GUIDE_TOUR_ID.workOrders]: [
    HELP_GUIDE_TOUR_ID.workOrderList,
    HELP_GUIDE_TOUR_ID.workOrderDetail,
  ],
};

export type HelpGuideTourId = (typeof HELP_GUIDE_TOUR_ID)[keyof typeof HELP_GUIDE_TOUR_ID];
