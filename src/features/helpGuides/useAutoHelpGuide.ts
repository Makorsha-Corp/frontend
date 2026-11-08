import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useMarkHelpGuideSeenMutation } from '@/features/auth/authApi';
import type { HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';
import { hasSeenHelpGuide } from '@/features/helpGuides/helpGuidesSeen';
import { destroyActiveHelpGuideTour } from '@/features/helpGuides/runHelpGuideTour';
import { startOrdersHelpGuideTour } from '@/features/helpGuides/tours/orders/startOrdersHelpGuideTour';
import { getOrdersHelpGuideTour } from '@/features/helpGuides/tours/orders/ordersTourRegistry';

let globalAutoHelpGuideRunning = false;

function isUiBlockingHelpTour(): boolean {
  if (globalAutoHelpGuideRunning) return true;
  if (document.querySelector('.driver-active')) return true;
  return !!document.querySelector('[role="dialog"][data-state="open"]');
}

export type UseAutoHelpGuideOptions = {
  tourId: HelpGuideTourId;
  /** When true, tour may start after delay once user has not seen this tour. */
  when: boolean;
  delayMs?: number;
};

/**
 * First-visit auto tour for Orders registry tours. Marks seen on any dismiss.
 */
export function useAutoHelpGuide({ tourId, when, delayMs = 400 }: UseAutoHelpGuideOptions): void {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const workspaceId = useAppSelector((state) => state.auth.workspace?.id);
  const [markSeen] = useMarkHelpGuideSeenMutation();
  const scheduledRef = useRef(false);
  const startedRef = useRef(false);
  const whenRef = useRef(when);
  whenRef.current = when;

  useEffect(() => {
    if (!when || !user || workspaceId == null) return;
    if (!getOrdersHelpGuideTour(tourId)) return;
    if (hasSeenHelpGuide(tourId, workspaceId, user)) return;
    if (startedRef.current || scheduledRef.current) return;

    scheduledRef.current = true;
    const timer = window.setTimeout(async () => {
      scheduledRef.current = false;
      if (startedRef.current) return;
      if (!whenRef.current) return;
      if (hasSeenHelpGuide(tourId, workspaceId, user)) return;
      if (isUiBlockingHelpTour()) return;

      startedRef.current = true;
      destroyActiveHelpGuideTour();
      globalAutoHelpGuideRunning = true;

      const getLocation = () => ({
        pathname: location.pathname,
        search: location.search,
      });

      try {
        await startOrdersHelpGuideTour(tourId, navigate, getLocation, {
          onDestroyed: () => {
            globalAutoHelpGuideRunning = false;
            void markSeen({ tour_id: tourId });
          },
        });
      } catch {
        globalAutoHelpGuideRunning = false;
        startedRef.current = false;
      }
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      scheduledRef.current = false;
    };
  }, [when, tourId, user, workspaceId, delayMs, navigate, location.pathname, location.search, markSeen]);
}

