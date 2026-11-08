import type { DriveStep, DriverHook } from 'driver.js';
import {
  HELP_GUIDE_CLOSE_FILTERS_EVENT,
  HELP_GUIDE_OPEN_FILTERS_EVENT,
  HELP_GUIDE_OPEN_SAMPLE_EVENT,
  HELP_GUIDE_PO_TOUR_ACTION_EVENT,
  type HelpGuidePoTourAction,
} from '@/features/helpGuides/helpGuideSession';
import {
  filterPanelIdFromHighlightedElement,
  filterPanelIdFromStep,
  filterPanelVisibleSelector,
  isFilterToggleStep,
  isOrderHubFilterPanelId,
  ORDER_HUB_FILTER_PANEL_IDS,
} from '@/features/helpGuides/helpGuideFilterPanels';
import { syncPoTourUiForStep, tourStepSelector } from '@/features/helpGuides/helpGuidePoTourUi';

/** Step `data` key: open this filters bar id before advancing (e.g. `po-filters-bar`). */
export const HELP_GUIDE_OPEN_FILTER_BAR_ID = 'helpGuideOpenFilterBarId';

/** Step `data` key: open the tour sample detail before advancing. */
export const HELP_GUIDE_OPEN_SAMPLE = 'helpGuideOpenSample';

/** Step `data` value: run PO sample action on Next (confirm / approve / finalize). */
export const HELP_GUIDE_PO_TOUR_ACTION = 'helpGuidePoTourAction';

function isDomVisible(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

export function waitForDomVisible(selector: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      if (isDomVisible(document.querySelector(selector))) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function advanceAfterLayout(driver: { isActive: () => boolean; refresh: () => void; moveNext: () => void }): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!driver.isActive()) return;
      driver.refresh();
      driver.moveNext();
    });
  });
}

function dispatchCloseFilterPanels(): void {
  for (const panelId of ORDER_HUB_FILTER_PANEL_IDS) {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_CLOSE_FILTERS_EVENT, { detail: panelId }));
  }
}

function dispatchOpenFilterPanel(panelId: string): void {
  if (!isOrderHubFilterPanelId(panelId)) return;
  window.dispatchEvent(new CustomEvent(HELP_GUIDE_OPEN_FILTERS_EVENT, { detail: panelId }));
}

function closeFilterPanelForElement(element: Element | undefined): void {
  const panelId = filterPanelIdFromHighlightedElement(element);
  if (panelId) {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_CLOSE_FILTERS_EVENT, { detail: panelId }));
  }
}

/** Next on filter / sample steps opens UI via events, then continues. Does not click the highlight. */
export const helpGuideOnNextClick: DriverHook = (element, step, { driver }) => {
  closeFilterPanelForElement(element);

  if (step.data?.[HELP_GUIDE_OPEN_SAMPLE] === true) {
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_OPEN_SAMPLE_EVENT));
    void waitForDomVisible('[data-help-tour="purchase.detail"], [data-help-tour="transfer.detail"], [data-help-tour="expense.detail"], [data-help-tour="work-orders.detail"]', 1_500).then(
      () => advanceAfterLayout(driver),
    );
    return;
  }

  const poTourAction = step.data?.[HELP_GUIDE_PO_TOUR_ACTION] as HelpGuidePoTourAction | undefined;
  const poTourPopoverNextActions: HelpGuidePoTourAction[] = [
    'confirm_items',
    'approve',
    'finalize_invoice',
    'open_receiving',
    'receive_items',
    'receive_qty_line_0',
    'receive_all_line_1',
    'confirm_receipt',
    'mark_order_complete',
  ];
  if (poTourAction && poTourPopoverNextActions.includes(poTourAction)) {
    // onNextClick only runs from popover Next — run sample action, then DONE advances.
    window.dispatchEvent(new CustomEvent(HELP_GUIDE_PO_TOUR_ACTION_EVENT, { detail: poTourAction }));
    return;
  }

  const barId = step.data?.[HELP_GUIDE_OPEN_FILTER_BAR_ID];
  if (typeof barId === 'string' && barId.length > 0 && isOrderHubFilterPanelId(barId)) {
    dispatchOpenFilterPanel(barId);
    void waitForDomVisible(filterPanelVisibleSelector(barId), 1_500).then(() =>
      advanceAfterLayout(driver),
    );
    return;
  }

  driver.moveNext();
};

export const helpGuideOnPrevClick: DriverHook = (element, _step, { driver }) => {
  closeFilterPanelForElement(element);
  const idx = driver.getActiveIndex();
  const steps = driver.getConfig().steps;
  const prevStep = idx != null && idx > 0 ? steps?.[idx - 1] : undefined;
  if (prevStep) {
    syncPoTourUiForStep(prevStep);
  }
  driver.movePrevious();
  const prevSelector = tourStepSelector(prevStep);
  const refreshDriver = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          driver.refresh();
        } catch {
          /* target may not be mounted yet */
        }
      });
    });
  };
  if (prevSelector) {
    void waitForDomVisible(prevSelector, 3_000).then(refreshDriver);
  } else {
    refreshDriver();
  }
};

export function syncFilterPanelsForTourStep(
  step: DriveStep,
  driverApi: { refresh: () => void },
): void {
  if (isFilterToggleStep(step)) {
    const barId = step.data?.[HELP_GUIDE_OPEN_FILTER_BAR_ID];
    if (typeof barId === 'string' && isOrderHubFilterPanelId(barId)) {
      window.dispatchEvent(new CustomEvent(HELP_GUIDE_CLOSE_FILTERS_EVENT, { detail: barId }));
    }
    return;
  }

  const panelFromElement = filterPanelIdFromStep(step);
  if (panelFromElement) {
    dispatchOpenFilterPanel(panelFromElement);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        driverApi.refresh();
      });
    });
    return;
  }

  dispatchCloseFilterPanels();
}
