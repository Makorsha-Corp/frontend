import type { DriveStep } from 'driver.js';
import { HELP_GUIDE_TOUR_ID, type HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';
import {
  buildPurchaseOrdersSteps,
  expenseOrdersSteps,
  ordersOverviewSteps,
  purchaseOrdersSteps,
  transferOrdersSteps,
  workOrdersSteps,
} from '@/features/helpGuides/tours/orders/ordersTourSteps';

export type OrdersHelpGuideTourDefinition = {
  id: HelpGuideTourId;
  title: string;
  linearIssueId: string;
  steps: DriveStep[];
  /** Exact pathname (e.g. /orders) — use instead of pathPrefix when needed. */
  exactPath?: string;
  /** Pathname prefix where this tour is meant to run (after prepare). */
  pathPrefix?: string;
  /** Optional search params that must match (subset). */
  requiredSearch?: Record<string, string>;
  prepareNavigate?: { pathname: string; search?: string };
};

export const ORDERS_HELP_GUIDE_TOURS: OrdersHelpGuideTourDefinition[] = [
  {
    id: HELP_GUIDE_TOUR_ID.ordersOverview,
    title: 'Walk orders overview',
    linearIssueId: 'MAK-182',
    steps: ordersOverviewSteps,
    exactPath: '/orders',
    prepareNavigate: { pathname: '/orders' },
  },
  {
    id: HELP_GUIDE_TOUR_ID.purchaseOrders,
    title: 'Walk purchase orders',
    linearIssueId: 'MAK-183',
    steps: purchaseOrdersSteps,
    pathPrefix: '/orders/purchase',
    prepareNavigate: { pathname: '/orders/purchase' },
  },
  {
    id: HELP_GUIDE_TOUR_ID.transferOrders,
    title: 'Walk transfer orders',
    linearIssueId: 'MAK-185',
    steps: transferOrdersSteps,
    pathPrefix: '/orders/transfer',
    prepareNavigate: { pathname: '/orders/transfer' },
  },
  {
    id: HELP_GUIDE_TOUR_ID.expenseOrders,
    title: 'Walk expense orders',
    linearIssueId: 'MAK-187',
    steps: expenseOrdersSteps,
    pathPrefix: '/orders/expense',
    prepareNavigate: { pathname: '/orders/expense' },
  },
  {
    id: HELP_GUIDE_TOUR_ID.workOrders,
    title: 'Walk work orders',
    linearIssueId: 'MAK-189',
    steps: workOrdersSteps,
    pathPrefix: '/machines',
    requiredSearch: { tab: 'workOrders' },
    prepareNavigate: { pathname: '/machines', search: '?tab=workOrders' },
  },
];

export function getOrdersHelpGuideTour(id: HelpGuideTourId): OrdersHelpGuideTourDefinition | undefined {
  const found = ORDERS_HELP_GUIDE_TOURS.find((t) => t.id === id);
  if (!found) return undefined;
  if (id === HELP_GUIDE_TOUR_ID.purchaseOrders) {
    return { ...found, steps: buildPurchaseOrdersSteps() };
  }
  return found;
}
