import type { DriveStep } from 'driver.js';
import {
  HELP_GUIDE_PO_TOUR_CLOSE_RECEIVING_EVENT,
  HELP_GUIDE_PO_TOUR_OPEN_RECEIVING_EVENT,
  HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT,
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
