import { useSyncExternalStore } from 'react';
import type { HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';

/** Open the order-hub filter strip / popover without clicking the highlighted toggle. */
export const HELP_GUIDE_OPEN_FILTERS_EVENT = 'makorsha:open-order-filters';

/** Close the order-hub filter strip / popover (detail = panel id, e.g. `po-filters-bar`). */
export const HELP_GUIDE_CLOSE_FILTERS_EVENT = 'makorsha:close-order-filters';

/** Open the on-screen sample detail for the active tour. */
export const HELP_GUIDE_OPEN_SAMPLE_EVENT = 'makorsha:open-tour-sample';

/** Purchase tour: request sample PO action (detail panel performs API + signals done). */
export const HELP_GUIDE_PO_TOUR_ACTION_EVENT = 'makorsha:po-tour-action';
/** Fires when action finished (success, no-op, or error) so driver Next can advance. */
export const HELP_GUIDE_PO_TOUR_ACTION_DONE_EVENT = 'makorsha:po-tour-action-done';

export type HelpGuidePoTourAction =
  | 'confirm_items'
  | 'approve'
  | 'finalize_invoice'
  | 'open_receiving'
  | 'receive_items'
  | 'receive_qty_line_0'
  | 'receive_all_line_1'
  | 'confirm_receipt'
  | 'mark_order_complete';

/** Close PoReceivingDialog when tour highlights the event log on the detail page. */
export const HELP_GUIDE_PO_TOUR_CLOSE_RECEIVING_EVENT = 'makorsha:po-tour-close-receiving';
export const HELP_GUIDE_PO_TOUR_OPEN_RECEIVING_EVENT = 'makorsha:po-tour-open-receiving';
export const HELP_GUIDE_PO_TOUR_RECEIVING_MODE_EVENT = 'makorsha:po-tour-receiving-mode';

export type HelpGuidePoReceivingTourMode = 'overview' | 'add';

/** driver.js step highlight: sync PO detail scrollHighlightTarget (checklist-style ring). */
export const HELP_GUIDE_DRIVER_HIGHLIGHT_TARGET_EVENT = 'makorsha:help-guide-driver-highlight-target';

export type HelpGuidePoDetailHighlightTarget =
  | 'items'
  | 'approve'
  | 'finalize'
  | null;

export const HELP_GUIDE_SAMPLE_ROW_ATTR = 'tour.sample-row';

let activeTourId: HelpGuideTourId | null = null;
/** After PO hub tour finishes (Done), keep sample detail open until user leaves it. */
let postTourSampleExplore = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function setActiveHelpGuideTour(tourId: HelpGuideTourId | null): void {
  if (activeTourId === tourId) return;
  activeTourId = tourId;
  emit();
}

export function getActiveHelpGuideTour(): HelpGuideTourId | null {
  return activeTourId;
}

export function subscribeHelpGuideTour(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHelpGuideTourActive(tourIds: readonly HelpGuideTourId[]): boolean {
  const active = useSyncExternalStore(
    subscribeHelpGuideTour,
    getActiveHelpGuideTour,
    getActiveHelpGuideTour,
  );
  return active != null && tourIds.includes(active);
}

export function setPostTourSampleExplore(value: boolean): void {
  if (postTourSampleExplore === value) return;
  postTourSampleExplore = value;
  emit();
}

export function getPostTourSampleExplore(): boolean {
  return postTourSampleExplore;
}

export function usePostTourSampleExplore(): boolean {
  return useSyncExternalStore(
    subscribeHelpGuideTour,
    getPostTourSampleExplore,
    getPostTourSampleExplore,
  );
}
