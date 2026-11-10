import { driver, type Config, type DestroyReason, type DriveStep } from 'driver.js';
import { appToast } from '@/lib/appToast';
import {
  HELP_GUIDE_PO_TOUR_ACTION,
  helpGuideOnNextClick,
  helpGuideOnPrevClick,
  syncFilterPanelsForTourStep,
  waitForDomVisible,
} from '@/features/helpGuides/helpGuideDriverNext';
import { stageRadiusForElement } from '@/features/helpGuides/helpGuideStageFit';
import {
  HELP_GUIDE_DRIVER_HIGHLIGHT_TARGET_EVENT,
  HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT,
  setActiveHelpGuideTour,
  setPostTourSampleExplore,
  type HelpGuidePoDetailHighlightTarget,
  type HelpGuidePoTourAction,
} from '@/features/helpGuides/helpGuideSession';
import { applyHelpGuideSpotlight, clearHelpGuideSpotlight } from '@/features/helpGuides/helpGuideSpotlight';
import { findVisibleHelpTourElement } from '@/features/helpGuides/helpTourVisibleElement';
import {
  PO_RECEIVING_DIALOG_TOUR_SELECTORS,
  isHelpGuideCompactLayout,
  syncPoTourLayoutForStep,
  syncPoTourUiForStep,
  tourStepSelector,
  tourStepWaitSelector,
} from '@/features/helpGuides/helpGuidePoTourUi';

export type HelpGuideTourRunOptions = {
  steps: DriveStep[];
  /** Run before the overlay opens (e.g. navigate to the right route). */
  prepare?: () => void | Promise<void>;
  /** Fires when the tour closes (driver destroy reason when available). */
  onDestroyed?: (reason?: DestroyReason) => void;
};

const defaultDriverOptions = {
  showProgress: true,
  smoothScroll: true,
  allowClose: true,
  /** Backdrop clicks do not dismiss — use X or Close only. */
  overlayClickBehavior: 'none' as const,
  /** Escape does not dismiss the tour. */
  allowKeyboardControl: false,
  /** Sheet stays invisible. Spotlight is sibling dim + a ring on the target. */
  overlayOpacity: 0,
  stagePadding: 4,
  stageRadius: 8,
  popoverClass: 'help-guide-popover',
  showButtons: ['next', 'previous', 'close'],
};

let fittingSpotlight = false;

function poDetailHighlightFromElement(el: HTMLElement): HelpGuidePoDetailHighlightTarget {
  if (el.id === 'po-confirm-items') return 'items';
  if (el.id === 'po-approve-order-btn') return 'approve';
  if (el.id === 'po-finalize-invoice-btn') return 'finalize';
  return null;
}

function closestScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight + 1
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** Detail panes are `h-screen` + `overflow-y-auto`. `scrollIntoView` often scrolls the window, which cannot move. */
function scrollTourTargetIntoView(target: HTMLElement): void {
  const scroller = closestScrollParent(target);
  if (scroller) {
    const parentRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const next =
      scroller.scrollTop +
      (targetRect.top - parentRect.top) -
      (scroller.clientHeight - targetRect.height) / 2;
    scroller.scrollTop = Math.max(0, next);
  }
  const rect = target.getBoundingClientRect();
  const margin = 72;
  const inView =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= margin &&
    rect.bottom <= window.innerHeight - margin;
  if (!inView) {
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
  }
}

function fitSpotlightToElement(
  element: Element | undefined,
  driverApi: { getConfig: () => Config; setConfig: (config: Config) => void; refresh: () => void },
): void {
  if (fittingSpotlight || !(element instanceof HTMLElement)) return;
  const stageRadius = stageRadiusForElement(element);
  const current = driverApi.getConfig();
  if (current.stagePadding === 4 && current.stageRadius === stageRadius) return;
  fittingSpotlight = true;
  driverApi.setConfig({ ...current, stagePadding: 4, stageRadius });
  driverApi.refresh();
  fittingSpotlight = false;
}

let activeDriver: ReturnType<typeof driver> | null = null;
let poTourAdvanceInFlight = false;

function poTourActionForActiveStep(): HelpGuidePoTourAction | null {
  if (!activeDriver?.isActive()) return null;
  const step = activeDriver.getActiveStep();
  const fromData = step?.data?.[HELP_GUIDE_PO_TOUR_ACTION] as HelpGuidePoTourAction | undefined;
  if (fromData) return fromData;
  const id = activeDriver.getActiveElement()?.id;
  if (id === 'po-confirm-items') return 'confirm_items';
  if (id === 'po-approve-order-btn') return 'approve';
  if (id === 'po-finalize-invoice-btn') return 'finalize_invoice';
  if (id === 'po-manage-receiving-btn') return 'open_receiving';
  if (id === 'po-receive-items-btn') return 'receive_items';
  if (id === 'po-receive-qty-line-0-stepper' || id === 'po-receive-qty-line-0') {
    return 'receive_qty_line_0';
  }
  if (id === 'po-receive-all-btn-1') return 'receive_all_line_1';
  if (id === 'po-confirm-receipt-btn') return 'confirm_receipt';
  if (id === 'po-mark-order-complete-btn') return 'mark_order_complete';
  return null;
}

const PO_TOUR_WAIT_SELECTOR_AFTER_ACTION: Partial<Record<HelpGuidePoTourAction, string>> = {
  confirm_items: '#po-approve-order-btn',
  approve: '#po-finalize-invoice-btn',
  finalize_invoice: '#po-manage-receiving-btn',
  receive_items: '#po-receive-qty-line-0-stepper',
  receive_qty_line_0: '#po-receive-all-btn-1',
  open_receiving: '#po-receive-items-btn',
};

function advanceHelpGuideTourAfterPoAction(action: HelpGuidePoTourAction): void {
  if (!activeDriver?.isActive()) return;
  if (poTourActionForActiveStep() !== action) return;
  if (poTourAdvanceInFlight) return;
  poTourAdvanceInFlight = true;

  const waitSelector = PO_TOUR_WAIT_SELECTOR_AFTER_ACTION[action];
  const moveAndRefresh = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!activeDriver?.isActive()) {
          poTourAdvanceInFlight = false;
          return;
        }
        activeDriver.moveNext();
        try {
          activeDriver.refresh();
        } catch {
          /* highlighted node may have unmounted */
        }
        poTourAdvanceInFlight = false;
      });
    });
  };
  if (waitSelector) {
    void waitForDomVisible(waitSelector, 3_000).then(moveAndRefresh);
  } else {
    moveAndRefresh();
  }
}

function onPoTourActionDone(event: Event): void {
  const action = (event as CustomEvent<HelpGuidePoTourAction>).detail;
  advanceHelpGuideTourAfterPoAction(action);
}

/** Start an on-screen walkthrough. Only one tour runs at a time. */
export async function runHelpGuideTour({
  steps,
  prepare,
  onDestroyed,
}: HelpGuideTourRunOptions): Promise<void> {
  activeDriver?.destroy();
  activeDriver = null;

  if (prepare) {
    await prepare();
  }

  window.addEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onPoTourActionDone);
  appToast.dismiss();

  activeDriver = driver({
    ...defaultDriverOptions,
    steps,
    onNextClick: helpGuideOnNextClick,
    onPrevClick: helpGuideOnPrevClick,
    onHighlighted: (element, step, { driver: driverApi }) => {
      syncFilterPanelsForTourStep(step, driverApi);
      syncPoTourUiForStep(step);
      syncPoTourLayoutForStep(step);
      const stepSelector = tourStepSelector(step);
      const waitSelector = tourStepWaitSelector(step);

      const finishHighlight = (highlightEl: Element | undefined) => {
        const target =
          highlightEl instanceof HTMLElement
            ? highlightEl
            : element instanceof HTMLElement
              ? element
              : undefined;
        if (!target) return;

        scrollTourTargetIntoView(target);
        fitSpotlightToElement(target, driverApi);
        const poTarget = poDetailHighlightFromElement(target);
        window.dispatchEvent(
          new CustomEvent(HELP_GUIDE_DRIVER_HIGHLIGHT_TARGET_EVENT, { detail: poTarget }),
        );
        applyHelpGuideSpotlight(target);
        try {
          driverApi.refresh();
        } catch {
          /* target may not be mounted yet */
        }
        requestAnimationFrame(() => {
          try {
            driverApi.refresh();
          } catch {
            /* target may not be mounted yet */
          }
        });
      };

      const needsWait =
        (stepSelector && PO_RECEIVING_DIALOG_TOUR_SELECTORS.has(stepSelector)) ||
        (isHelpGuideCompactLayout() && waitSelector != null);
      if (needsWait && waitSelector) {
        void waitForDomVisible(waitSelector, 3_000).then(() => {
          finishHighlight(findVisibleHelpTourElement(waitSelector) ?? element);
        });
      } else {
        finishHighlight(
          (waitSelector ? findVisibleHelpTourElement(waitSelector) : null) ?? element,
        );
      }
    },
    onDestroyed: (_element, _step, { reason }) => {
      window.removeEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onPoTourActionDone);
      window.dispatchEvent(
        new CustomEvent(HELP_GUIDE_DRIVER_HIGHLIGHT_TARGET_EVENT, { detail: null }),
      );
      clearHelpGuideSpotlight();
      activeDriver = null;
      onDestroyed?.(reason);
    },
  });

  activeDriver.drive();
}

export function destroyActiveHelpGuideTour(): void {
  setPostTourSampleExplore(false);
  window.removeEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onPoTourActionDone);
  window.dispatchEvent(
    new CustomEvent(HELP_GUIDE_DRIVER_HIGHLIGHT_TARGET_EVENT, { detail: null }),
  );
  clearHelpGuideSpotlight();
  activeDriver?.destroy();
  activeDriver = null;
  setActiveHelpGuideTour(null);
}
