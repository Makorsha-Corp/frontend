import type { NavigateFunction } from 'react-router-dom';
import type { HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';
import { destroyActiveHelpGuideTour } from '@/features/helpGuides/runHelpGuideTour';
import { startOrdersHelpGuideTour } from '@/features/helpGuides/tours/orders/startOrdersHelpGuideTour';

export async function replayHelpGuideTour(
  tourId: HelpGuideTourId,
  navigate: NavigateFunction,
  getLocation: () => { pathname: string; search: string },
  onMarkSeen: (tourId: HelpGuideTourId) => void,
): Promise<void> {
  destroyActiveHelpGuideTour();
  await new Promise((r) => window.setTimeout(r, 200));
  await startOrdersHelpGuideTour(tourId, navigate, getLocation, {
    onDestroyed: () => {
      onMarkSeen(tourId);
    },
  });
}
