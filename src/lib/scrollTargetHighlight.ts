import { useCallback, useEffect, useState } from 'react';

/** PO checklist / form “needs attention” glow — see `index.css` + `progressDesign.md`. */
export const SCROLL_TARGET_HIGHLIGHT_CLASS = 'po-scroll-target-highlight';

/** Auto-dismiss after pulse (matches PO line-item ✓ highlight). */
export const SCROLL_TARGET_HIGHLIGHT_AUTO_CLEAR_MS = 3500;

export function useScrollTargetHighlight() {
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (!highlighted) return;
    const timer = window.setTimeout(
      () => setHighlighted(false),
      SCROLL_TARGET_HIGHLIGHT_AUTO_CLEAR_MS,
    );
    return () => window.clearTimeout(timer);
  }, [highlighted]);

  const pulseHighlight = useCallback(() => {
    setHighlighted(true);
  }, []);

  const dismissHighlight = useCallback(() => {
    setHighlighted(false);
  }, []);

  return {
    highlighted,
    pulseHighlight,
    dismissHighlight,
  };
}
