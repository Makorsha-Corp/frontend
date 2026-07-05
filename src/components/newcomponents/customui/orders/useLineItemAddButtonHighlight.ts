import { useCallback, useEffect, useState } from 'react';

const HIGHLIGHT_AUTO_CLEAR_MS = 3500;

export function useLineItemAddButtonHighlight() {
  const [addButtonHighlighted, setAddButtonHighlighted] = useState(false);

  useEffect(() => {
    if (!addButtonHighlighted) return;
    const timer = window.setTimeout(() => setAddButtonHighlighted(false), HIGHLIGHT_AUTO_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [addButtonHighlighted]);

  const pulseAddButtonHighlight = useCallback(() => {
    setAddButtonHighlighted(true);
  }, []);

  const dismissAddButtonHighlight = useCallback(() => {
    setAddButtonHighlighted(false);
  }, []);

  return {
    addButtonHighlighted,
    pulseAddButtonHighlight,
    dismissAddButtonHighlight,
  };
}

/** First submit with draft → show footer popover + pulse ✓; second submit clears draft and continues. */
export function handleUnaddedItemDraftOnSubmit(args: {
  hasUnaddedItemDraft: boolean;
  unaddedHintOpen: boolean;
  setUnaddedHintOpen: (open: boolean) => void;
  pulseAddButtonHighlight: () => void;
  clearDraft: () => void;
}): 'blocked' | 'continued' {
  const {
    hasUnaddedItemDraft,
    unaddedHintOpen,
    setUnaddedHintOpen,
    pulseAddButtonHighlight,
    clearDraft,
  } = args;

  if (!hasUnaddedItemDraft) return 'continued';

  if (!unaddedHintOpen) {
    setUnaddedHintOpen(true);
    pulseAddButtonHighlight();
    return 'blocked';
  }

  clearDraft();
  setUnaddedHintOpen(false);
  return 'continued';
}
