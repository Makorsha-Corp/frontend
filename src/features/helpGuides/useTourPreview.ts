import { useEffect, useRef, useState } from 'react';
import {
  HELP_GUIDE_CLOSE_FILTERS_EVENT,
  HELP_GUIDE_OPEN_FILTERS_EVENT,
  HELP_GUIDE_CLOSE_SAMPLE_EVENT,
  HELP_GUIDE_OPEN_SAMPLE_EVENT,
  useHelpGuideTourActive,
  usePostTourSampleExplore,
} from '@/features/helpGuides/helpGuideSession';
import type { HelpGuideTourId } from '@/features/helpGuides/helpGuideTourIds';

export function useOpenFiltersOnTourEvent(
  barId: string,
  setFiltersOpen: (open: boolean) => void,
): void {
  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === barId) setFiltersOpen(true);
    };
    window.addEventListener(HELP_GUIDE_OPEN_FILTERS_EVENT, onOpen);
    return () => window.removeEventListener(HELP_GUIDE_OPEN_FILTERS_EVENT, onOpen);
  }, [barId, setFiltersOpen]);
}

export function useCloseFiltersOnTourEvent(
  barId: string,
  setFiltersOpen: (open: boolean) => void,
): void {
  useEffect(() => {
    const onClose = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === barId) setFiltersOpen(false);
    };
    window.addEventListener(HELP_GUIDE_CLOSE_FILTERS_EVENT, onClose);
    return () => window.removeEventListener(HELP_GUIDE_CLOSE_FILTERS_EVENT, onClose);
  }, [barId, setFiltersOpen]);
}

/** Sample detail is open only while one of these tours is running. */
export function useTourSampleDetail(tourIds: readonly HelpGuideTourId[]): {
  tourActive: boolean;
  postTourExplore: boolean;
  sampleOpen: boolean;
  openSample: () => void;
  closeSample: () => void;
} {
  const tourActive = useHelpGuideTourActive(tourIds);
  const postTourExplore = usePostTourSampleExplore();
  const [sampleOpen, setSampleOpen] = useState(false);

  useEffect(() => {
    if (!tourActive && !postTourExplore) setSampleOpen(false);
  }, [tourActive, postTourExplore]);

  useEffect(() => {
    const onOpen = () => setSampleOpen(true);
    const onClose = () => setSampleOpen(false);
    window.addEventListener(HELP_GUIDE_OPEN_SAMPLE_EVENT, onOpen);
    window.addEventListener(HELP_GUIDE_CLOSE_SAMPLE_EVENT, onClose);
    return () => {
      window.removeEventListener(HELP_GUIDE_OPEN_SAMPLE_EVENT, onOpen);
      window.removeEventListener(HELP_GUIDE_CLOSE_SAMPLE_EVENT, onClose);
    };
  }, []);

  useEffect(() => {
    if (postTourExplore) setSampleOpen(true);
  }, [postTourExplore]);

  return {
    tourActive,
    postTourExplore,
    sampleOpen: (tourActive && sampleOpen) || postTourExplore,
    openSample: () => setSampleOpen(true),
    closeSample: () => setSampleOpen(false),
  };
}

/** Clear real selection when a whole-page hub tour starts. */
export function useResetSelectionWhenTourStarts(
  tourActive: boolean,
  onReset: () => void,
): void {
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (tourActive && !wasActiveRef.current) {
      onReset();
    }
    wasActiveRef.current = tourActive;
  }, [tourActive, onReset]);
}
