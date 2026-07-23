import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';

export function useLineItemAddButtonHighlight() {
  const {
    highlighted: addButtonHighlighted,
    pulseHighlight: pulseAddButtonHighlight,
    dismissHighlight: dismissAddButtonHighlight,
  } = useScrollTargetHighlight();

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
