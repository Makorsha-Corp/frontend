import type { DestroyReason } from 'driver.js';
import type { NavigateFunction } from 'react-router-dom';
import { runHelpGuideTour } from '@/features/helpGuides/runHelpGuideTour';
import { HELP_GUIDE_TOUR_ID, type HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';
import {
  getOrdersHelpGuideTour,
  type OrdersHelpGuideTourDefinition,
} from '@/features/helpGuides/tours/orders/ordersTourRegistry';
import {
  getActiveHelpGuideTour,
  setActiveHelpGuideTour,
  setPostTourSampleExplore,
} from '@/features/helpGuides/helpGuideSession';

function pathnameMatches(def: OrdersHelpGuideTourDefinition, pathname: string, search: string): boolean {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (def.exactPath) {
    const exact = def.exactPath.endsWith('/') ? def.exactPath.slice(0, -1) : def.exactPath;
    if (normalized !== exact) return false;
  } else if (def.pathPrefix && !normalized.startsWith(def.pathPrefix)) {
    return false;
  }
  if (!def.requiredSearch) return true;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return Object.entries(def.requiredSearch).every(([key, value]) => params.get(key) === value);
}

function waitForPath(
  def: OrdersHelpGuideTourDefinition,
  getLocation: () => { pathname: string; search: string },
  timeoutMs = 8_000,
): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const { pathname, search } = getLocation();
      if (pathnameMatches(def, pathname, search)) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for page navigation'));
        return;
      }
      window.requestAnimationFrame(tick);
    };
    tick();
  });
}

export type StartOrdersHelpGuideTourOptions = {
  onDestroyed?: (reason?: DestroyReason) => void;
};

export async function startOrdersHelpGuideTour(
  tourId: HelpGuideTourId,
  navigate: NavigateFunction,
  getLocation: () => { pathname: string; search: string },
  options?: StartOrdersHelpGuideTourOptions,
): Promise<void> {
  const def = getOrdersHelpGuideTour(tourId);
  if (!def) return;

  setActiveHelpGuideTour(tourId);
  try {
  await runHelpGuideTour({
    steps: def.steps,
    onDestroyed: (reason) => {
      if (reason === 'done' && tourId === HELP_GUIDE_TOUR_ID.purchaseOrders) {
        setPostTourSampleExplore(true);
      } else {
        setPostTourSampleExplore(false);
      }
      if (getActiveHelpGuideTour() === tourId) {
        setActiveHelpGuideTour(null);
      }
      options?.onDestroyed?.(reason);
    },
    prepare: async () => {
      const { pathname, search } = getLocation();
      if (pathnameMatches(def, pathname, search)) {
        return;
      }
      if (def.prepareNavigate) {
        navigate(
          { pathname: def.prepareNavigate.pathname, search: def.prepareNavigate.search },
          { replace: false },
        );
        await waitForPath(def, getLocation);
        // Let hub layouts mount after navigation.
        await new Promise((r) => window.setTimeout(r, 350));
      }
    },
  });
  } catch (error) {
    setActiveHelpGuideTour(null);
    throw error;
  }
}
