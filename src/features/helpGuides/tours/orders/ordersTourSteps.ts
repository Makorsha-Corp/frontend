import type { DriveStep } from 'driver.js';
import { HELP_GUIDE_OPEN_SAMPLE, HELP_GUIDE_PO_TOUR_ACTION } from '@/features/helpGuides/helpGuideDriverNext';
import { isHelpGuideCompactLayout } from '@/features/helpGuides/helpGuidePoTourUi';
import {
  HELP_GUIDE_LAYOUT_PANEL,
  HELP_GUIDE_SAMPLE_ROW_ATTR,
  HELP_GUIDE_WAIT_SELECTOR,
} from '@/features/helpGuides/helpGuideSession';
import { helpTourVisibleElement } from '@/features/helpGuides/helpTourVisibleElement';

const hubHeaderAddStep = (selector: string, title: string, description: string): DriveStep => ({
  element: helpTourVisibleElement(selector),
  data: {
    [HELP_GUIDE_LAYOUT_PANEL]: 'list',
    [HELP_GUIDE_WAIT_SELECTOR]: selector,
  },
  popover: { title, description },
});

const openSampleRowStep = (): DriveStep => ({
  element: `[data-help-tour="${HELP_GUIDE_SAMPLE_ROW_ATTR}"]`,
  advanceOnClick: true,
  data: {
    [HELP_GUIDE_OPEN_SAMPLE]: true,
    [HELP_GUIDE_LAYOUT_PANEL]: 'list',
    [HELP_GUIDE_WAIT_SELECTOR]: `[data-help-tour="${HELP_GUIDE_SAMPLE_ROW_ATTR}"]`,
  },
  popover: {
    title: 'Open the sample order',
    description:
      'Click the Sample row. It is only on screen for this tour and resets when the guide ends.',
  },
});

const waitForDetailStep = (detailSelector: string, title: string, description: string): DriveStep => ({
  element: detailSelector,
  waitForElement: 120_000,
  skipMissingElement: false,
  data: {
    [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
    [HELP_GUIDE_WAIT_SELECTOR]: detailSelector,
  },
  popover: { title, description },
});

export const ordersOverviewSteps: DriveStep[] = [
  {
    element: '[data-help-tour="orders-overview.hub-cards"]',
    popover: {
      title: 'Order hubs',
      description: 'Jump to Purchase, Transfer, or Expense from these cards.',
    },
    advanceOnClick: true,
  },
  {
    element: '[data-help-tour="orders-overview.factory-scope"]',
    popover: {
      title: 'Factory scope',
      description: 'Limit overview KPIs and charts to one factory or all factories.',
    },
  },
  {
    element: '[data-help-tour="orders-overview.date-range"]',
    popover: {
      title: 'Date range',
      description: 'Filter overview metrics and recent activity by order dates.',
    },
  },
  {
    element: '[data-help-tour="orders-overview.status"]',
    popover: {
      title: 'Status filter',
      description: 'Narrow the overview to orders in a specific workflow status.',
    },
  },
  {
    element: '[data-help-tour="orders-overview.recent-activity"]',
    popover: {
      title: 'Recent activity',
      description: 'Open an order in its hub by clicking a row here.',
    },
    advanceOnClick: true,
  },
];

export const purchaseOrderListSteps: DriveStep[] = [
  hubHeaderAddStep(
    '[data-help-tour="purchase.header-add"]',
    'Create purchase order',
    'Start a new PO from here.',
  ),
  {
    element: '[data-help-tour="purchase.navigator"]',
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'list',
      [HELP_GUIDE_WAIT_SELECTOR]: '[data-help-tour="purchase.navigator"]',
    },
    popover: {
      title: 'Order list',
      description: 'Browse POs, paginate, and toggle completed orders.',
    },
  },
  {
    element: '[data-help-tour="purchase.overview"]',
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'list',
      [HELP_GUIDE_WAIT_SELECTOR]: '[data-help-tour="purchase.overview"]',
    },
    popover: {
      title: 'Overview',
      description: 'KPIs and recent PO activity when no order is selected.',
    },
  },
];

export const purchaseOrderDetailSteps: DriveStep[] = [
  openSampleRowStep(),
  waitForDetailStep(
    '[data-help-tour="purchase.detail"]',
    'Purchase order detail',
    'Follow the checklist at the top. On this sample you confirm items, approve, finalize, receive everything, then mark the order complete.',
  ),
  {
    element: '#po-confirm-items',
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-confirm-items',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'confirm_items' as const,
    },
    popover: {
      title: 'Confirm order items',
      description:
        'Click the checkmark to confirm order items and prices. That creates the draft invoice and unlocks approval.',
    },
  },
  {
    element: '#po-approve-order-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-approve-order-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'approve' as const,
    },
    popover: {
      title: 'Approve',
      description:
        'Click Approve on your approver chip so this order meets its approval requirement.',
    },
  },
  {
    element: '#po-finalize-invoice-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-finalize-invoice-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'finalize_invoice' as const,
    },
    popover: {
      title: 'Finalize invoice',
      description:
        'Click Finalize Invoice to confirm the payable and lock the financial side.',
    },
  },
  {
    element: '#po-manage-receiving-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-manage-receiving-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'open_receiving' as const,
    },
    popover: {
      title: 'Manage receiving',
      description:
        'After the invoice is finalized, click Manage receiving to log goods as they arrive.',
    },
  },
  {
    element: '#po-receive-items-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-receive-items-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'receive_items' as const,
    },
    popover: {
      title: 'Receive items',
      description: 'Click Receive Items to enter quantities for this shipment.',
    },
  },
  {
    element: '#po-receive-qty-line-0-stepper',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-receive-qty-line-0-stepper',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'receive_qty_line_0' as const,
    },
    popover: {
      title: 'Ring frame spare belt',
      description:
        'Set the first line to 4 (type, use the chevrons, or click Next). Next fills the full order qty for this sample line.',
    },
  },
  {
    element: '#po-receive-all-btn-1',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-receive-all-btn-1',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'receive_all_line_1' as const,
    },
    popover: {
      title: 'Lubricating oil',
      description: 'Click All on the second line to receive the remaining 2 drums.',
    },
  },
  {
    element: '#po-confirm-receipt-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-confirm-receipt-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'confirm_receipt' as const,
    },
    popover: {
      title: 'Confirm receipt',
      description: 'Click Confirm Receipt to save this shipment (4 belts + 2 drums).',
    },
  },
  {
    element: '#po-receive-history',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-receive-history',
    },
    popover: {
      title: 'Receive history',
      description: 'Each save appears here. Use Correction later if counts need adjusting.',
    },
  },
  {
    element: '#po-event-log',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-event-log',
    },
    popover: {
      title: 'Event log',
      description:
        'The same receipt is recorded on the order timeline — audit trail for the whole PO.',
    },
  },
  {
    element: '#po-mark-order-complete-btn',
    waitForElement: 120_000,
    skipMissingElement: false,
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#po-mark-order-complete-btn',
      [HELP_GUIDE_PO_TOUR_ACTION]: 'mark_order_complete' as const,
    },
    popover: {
      title: 'Mark order complete',
      description:
        'When every line is fully received, click Mark order complete to close this PO in the workflow.',
    },
  },
  {
    element: '#order-discussion',
    data: {
      [HELP_GUIDE_LAYOUT_PANEL]: 'detail',
      [HELP_GUIDE_WAIT_SELECTOR]: '#order-discussion',
    },
    popover: {
      title: 'Discussion and files',
      description: 'Team notes and attachments anytime — they do not replace confirms or approvals.',
    },
  },
];

const mergeHubTourSteps = (listSteps: DriveStep[], detailSteps: DriveStep[]): DriveStep[] => [
  ...listSteps,
  ...detailSteps,
];

export const purchaseOrdersSteps = mergeHubTourSteps(
  purchaseOrderListSteps,
  purchaseOrderDetailSteps,
);

/** Below `lg`, overview is not mounted until an order is open, and the list hides once it is. */
export function buildPurchaseOrdersSteps(
  compact = isHelpGuideCompactLayout(),
): DriveStep[] {
  const list = purchaseOrderListSteps.flatMap((step) => {
    if (compact && step.element === '[data-help-tour="purchase.overview"]') return [];
    if (compact && step.element === '[data-help-tour="purchase.navigator"]') {
      return [
        {
          ...step,
          popover: {
            title: 'Order list',
            description:
              'On this width the list fills the page. KPIs sit beside the list on a wide screen. Open the sample row next.',
          },
        },
      ];
    }
    return [step];
  });
  return mergeHubTourSteps(list, purchaseOrderDetailSteps);
}

export const transferOrderListSteps: DriveStep[] = [
  hubHeaderAddStep(
    '[data-help-tour="transfer.header-add"]',
    'Create transfer',
    'Start a new internal transfer order.',
  ),
  {
    element: '[data-help-tour="transfer.navigator"]',
    popover: { title: 'Order list', description: 'Browse transfer orders and open one to view detail.' },
  },
  {
    element: '[data-help-tour="transfer.overview"]',
    popover: { title: 'Overview', description: 'KPIs when no transfer is selected.' },
  },
];

export const transferOrderDetailSteps: DriveStep[] = [
  openSampleRowStep(),
  waitForDetailStep(
    '[data-help-tour="transfer.detail"]',
    'Transfer detail',
    'Route, items, and progress for the selected transfer.',
  ),
  {
    element: '#tr-section-route',
    popover: { title: 'Route', description: 'Source and destination for this transfer.' },
  },
  {
    element: '#tr-section-items',
    popover: { title: 'Line items', description: 'Items and quantities being moved.' },
  },
];

export const expenseOrderListSteps: DriveStep[] = [
  hubHeaderAddStep(
    '[data-help-tour="expense.header-add"]',
    'Create expense',
    'Start a new expense order.',
  ),
  {
    element: '[data-help-tour="expense.navigator"]',
    popover: { title: 'Order list', description: 'Browse expense orders.' },
  },
  {
    element: '[data-help-tour="expense.overview"]',
    popover: { title: 'Overview', description: 'KPIs when no expense is selected.' },
  },
];

export const expenseOrderDetailSteps: DriveStep[] = [
  openSampleRowStep(),
  waitForDetailStep(
    '[data-help-tour="expense.detail"]',
    'Expense detail',
    'Details and line items for the selected expense order.',
  ),
  {
    element: '#eo-section-details',
    popover: { title: 'Order details', description: 'Dates, category, and notes.' },
  },
  {
    element: '#eo-section-items',
    popover: { title: 'Expense lines', description: 'Individual expense rows and accounts.' },
  },
];

export const workOrderListSteps: DriveStep[] = [
  {
    element: '[data-help-tour="work-orders.tab"]',
    popover: {
      title: 'Work orders tab',
      description: 'Work orders live under Machines alongside machine inventory.',
    },
  },
  hubHeaderAddStep(
    '[data-help-tour="work-orders.header-add"]',
    'Create work order',
    'Schedule maintenance or machine work.',
  ),
  {
    element: '[data-help-tour="work-orders.list"]',
    popover: { title: 'Work order list', description: 'Open a row to see detail.' },
  },
];

export const workOrderDetailSteps: DriveStep[] = [
  openSampleRowStep(),
  waitForDetailStep(
    '[data-help-tour="work-orders.detail"]',
    'Work order detail',
    'Timing, machine, and status for the selected work order.',
  ),
];

export const transferOrdersSteps = mergeHubTourSteps(
  transferOrderListSteps,
  transferOrderDetailSteps,
);

export const expenseOrdersSteps = mergeHubTourSteps(
  expenseOrderListSteps,
  expenseOrderDetailSteps,
);

export const workOrdersSteps = mergeHubTourSteps(workOrderListSteps, workOrderDetailSteps);
