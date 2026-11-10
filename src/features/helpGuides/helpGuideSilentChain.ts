import { appToast } from '@/lib/appToast';
import {
  HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT,
  HELP_GUIDE_PO_TOUR_ACTION_EVENT,
  type HelpGuidePoTourAction,
} from '@/features/helpGuides/helpGuideSession';
import { waitForDomVisible } from '@/features/helpGuides/helpGuideDriverNext';

export type RunPoTourChainOptions = {
  stepMs?: number;
  actionTimeoutMs?: number;
  beats?: string[];
  onBeat?: (index: number, action: HelpGuidePoTourAction, beatText?: string) => void;
  /** Called after each action completes (0-based index). */
  onActionDone?: (index: number, action: HelpGuidePoTourAction) => void;
};

const WAIT_AFTER_ACTION: Partial<Record<HelpGuidePoTourAction, string>> = {
  tour_create_open_item_picker: '#po-tour-create-item-lubricating',
  tour_create_confirm_item: '#po-tour-create-qty',
  tour_create_set_qty: '#po-tour-create-add-line',
  tour_create_add_line: '#po-tour-create-lines .divide-y > div:last-child',
  finalize_invoice: '#po-manage-receiving-btn',
  open_receiving: '#po-receive-items-btn',
  receive_items: '#po-receive-qty-line-0-stepper, #po-receive-qty-line-0',
  receive_qty_line_0: '#po-receive-all-btn-1, #po-confirm-receipt-btn',
  receive_all_line_1: '#po-confirm-receipt-btn',
};

let chainCancelRequested = false;

export function requestPoTourChainCancel(): void {
  chainCancelRequested = true;
}

export function resetPoTourChainCancel(): void {
  chainCancelRequested = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForPoTourActionDone(
  action: HelpGuidePoTourAction,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<HelpGuidePoTourAction>).detail;
      if (detail !== action) return;
      window.removeEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onDone);
      clearTimeout(timer);
      resolve(true);
    };
    const timer = window.setTimeout(() => {
      window.removeEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onDone);
      resolve(false);
    }, Math.max(0, deadline - Date.now()));
    window.addEventListener(HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT, onDone);
  });
}

/** Run sample PO actions in order (tour sandbox / detail panel listeners perform the work). */
export async function runPoTourChain(
  actions: readonly HelpGuidePoTourAction[],
  options: RunPoTourChainOptions = {},
): Promise<boolean> {
  const stepMs = options.stepMs ?? 1_000;
  const actionTimeoutMs = options.actionTimeoutMs ?? 6_000;

  for (let i = 0; i < actions.length; i += 1) {
    if (chainCancelRequested) return false;

    const action = actions[i];
    const beatText = options.beats?.[i];
    options.onBeat?.(i, action, beatText);

    const donePromise = waitForPoTourActionDone(action, actionTimeoutMs);
    window.dispatchEvent(
      new CustomEvent(HELP_GUIDE_PO_TOUR_ACTION_EVENT, { detail: action }),
    );

    const finished = await donePromise;
    if (!finished) {
      appToast.error('Tour step timed out — try the action manually or restart the guide.');
      return false;
    }

    options.onActionDone?.(i, action);

    const waitSelector = WAIT_AFTER_ACTION[action];
    if (waitSelector) {
      await waitForDomVisible(waitSelector, actionTimeoutMs);
    }

    if (i < actions.length - 1) {
      await sleep(stepMs);
    }
  }

  return true;
}
