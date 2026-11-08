import type { DriveStep } from 'driver.js';
import { HELP_GUIDE_OPEN_FILTER_BAR_ID } from '@/features/helpGuides/helpGuideDriverNext';

/** Event `detail` ids — match filter strip / popover `id` on each hub. */
export const ORDER_HUB_FILTER_PANEL_IDS = ['po-filters-bar', 'tr-filters-bar', 'eo-filters-bar'] as const;

export type OrderHubFilterPanelId = (typeof ORDER_HUB_FILTER_PANEL_IDS)[number];

export function isOrderHubFilterPanelId(id: string): id is OrderHubFilterPanelId {
  return (ORDER_HUB_FILTER_PANEL_IDS as readonly string[]).includes(id);
}

/** DOM selector to wait for when a panel should be visible. */
export function filterPanelVisibleSelector(panelId: OrderHubFilterPanelId): string {
  if (panelId === 'po-filters-bar') {
    return '[data-help-tour="purchase.filters-panel"]';
  }
  if (panelId === 'tr-filters-bar') {
    return '[data-help-tour="transfer.filters-panel"]';
  }
  if (panelId === 'eo-filters-bar') {
    return '[data-help-tour="expense.filters-panel"]';
  }
  return `#${panelId}`;
}

export function filterPanelIdFromStep(step: DriveStep): OrderHubFilterPanelId | null {
  const el = step.element;
  if (typeof el === 'string') {
    if (el.includes('purchase.filters-panel')) return 'po-filters-bar';
    if (el.includes('transfer.filters-panel')) return 'tr-filters-bar';
    if (el.includes('expense.filters-panel')) return 'eo-filters-bar';
    if (el.startsWith('#')) {
      const id = el.slice(1);
      if (isOrderHubFilterPanelId(id)) return id;
    }
  }
  return null;
}

export function isFilterToggleStep(step: DriveStep): boolean {
  const barId = step.data?.[HELP_GUIDE_OPEN_FILTER_BAR_ID];
  return typeof barId === 'string' && isOrderHubFilterPanelId(barId);
}

export function filterPanelIdFromHighlightedElement(element: Element | undefined): OrderHubFilterPanelId | null {
  if (!(element instanceof HTMLElement)) return null;
  if (element.id && isOrderHubFilterPanelId(element.id)) return element.id;
  const tour = element.getAttribute('data-help-tour');
  if (tour === 'purchase.filters-panel') return 'po-filters-bar';
  if (tour === 'transfer.filters-panel') return 'tr-filters-bar';
  if (tour === 'expense.filters-panel') return 'eo-filters-bar';
  return null;
}
