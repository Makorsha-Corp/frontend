import type { DriveStep } from 'driver.js';
import { HELP_GUIDE_TOUR_ID } from '@/features/helpGuides/helpGuideTourIds';
import {
  HELP_GUIDE_CLOSE_SAMPLE_EVENT,
  HELP_GUIDE_LAYOUT_PANEL,
  HELP_GUIDE_OPEN_SAMPLE_EVENT,
  HELP_GUIDE_PO_TOUR_CLOSE_RECEIVING_EVENT,
  HELP_GUIDE_PO_TOUR_OPEN_RECEIVING_EVENT,
  HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT,
  HELP_GUIDE_WAIT_SELECTOR,
  getActiveHelpGuideTour,
  type HelpGuideLayoutPanel,
  type HelpGuidePoReceivingTourMode,
} from '@/features/helpGuides/helpGuideSession';

export const PO_RECEIVING_DIALOG_TOUR_SELECTORS = new Set([
  '#po-receive-items-btn',
  '#po-receive-qty-line-0-stepper',
  '#po-receive-all-btn-1',
  '#po-confirm-receipt-btn',
  '#po-receive-history',
]);

export function tourStepSelector(step: DriveStep | undefined): string | null {
  if (!step?.element) return null;
  return typeof step.element === 'string' ? step.element : null;
}

export function tourStepWaitSelector(step: DriveStep | undefined): string | null {
  const fromData = step?.data?.[HELP_GUIDE_WAIT_SELECTOR];
  if (typeof fromData === 'string' && fromData.length > 0) return fromData;
  return tourStepSelector(step);
}

export function isHelpGuideCompactLayout(): boolean {
  return typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches;
}

/** Narrow hub: list and detail cannot show together. Match the open panel to the step. */
export function syncPoTourLayoutForStep(step: DriveStep | undefined): void {
  if (!step || !isHelpGuideCompactLayout()) return;
  if (getActiveHelpGuideTour() !== HELP_GUIDE_TOUR_ID.purchaseOrders) return;
  const panel = step.data?.[HELP_GUIDE_LAYOUT_PANEL] as HelpGuideLayoutPanel | undefined;
  if (panel === 'list') {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_CLOSE_SAMPLE_EVENT));
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_CLOSE_RECEIVING_EVENT));
    return;
  }
  if (panel === 'detail') {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_OPEN_SAMPLE_EVENT));
  }
}

function receivingModeForSelector(selector: string): HelpGuidePoReceivingTourMode | null {
  if (selector === '#po-receive-items-btn' || selector === '#po-receive-history') {
    return 'overview';
  }
  if (
    selector === '#po-receive-qty-line-0-stepper' ||
    selector === '#po-receive-all-btn-1' ||
    selector === '#po-confirm-receipt-btn'
  ) {
    return 'add';
  }
  return null;
}

/** Match receiving dialog + detail targets when tour moves forward or back. */
export function syncPoTourUiForStep(step: DriveStep | undefined): void {
  const selector = tourStepSelector(step);
  if (!selector) return;

  if (!PO_RECEIVING_DIALOG_TOUR_SELECTORS.has(selector)) {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_CLOSE_RECEIVING_EVENT));
    return;
  }

  window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_OPEN_RECEIVING_EVENT));
  const mode = receivingModeForSelector(selector);
  if (mode) {
    window.dispatchEvent(
      new CustomEvent(HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT, { detail: mode }),
    );
  }
}
