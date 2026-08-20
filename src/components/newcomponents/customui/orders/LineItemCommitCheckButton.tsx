import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SCROLL_TARGET_HIGHLIGHT_CLASS } from '@/lib/scrollTargetHighlight';

export interface LineItemCommitCheckButtonProps {
  canCommit: boolean;
  highlighted?: boolean;
  hintOpen?: boolean;
  hintText: string;
  onCommit: () => void;
  onDismissHint?: () => void;
  onDismissHighlight?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  /** Match adjacent h-9 fields (footer) vs default h-10 (dialogs). */
  size?: 'default' | 'sm';
}

const LineItemCommitCheckButton: React.FC<LineItemCommitCheckButtonProps> = ({
  canCommit,
  highlighted = false,
  hintOpen = false,
  hintText,
  onCommit,
  onDismissHint,
  onDismissHighlight,
  ariaLabel = 'Add part to list',
  disabled = false,
  size = 'default',
}) => {
  useEffect(() => {
    if (!hintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-add-item-hint-root]')) {
        onDismissHint?.();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [hintOpen, onDismissHint]);

  const dim = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <div className="relative shrink-0" data-add-item-hint-root>
      {hintOpen && !canCommit ? (
        <div
          role="tooltip"
          className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {hintText}
        </div>
      ) : null}
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        className={cn(
          canCommit && !disabled
            ? `${dim} bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground`
            : `${dim} bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600 cursor-not-allowed`,
          highlighted && SCROLL_TARGET_HIGHLIGHT_CLASS,
        )}
        onClick={onCommit}
        onMouseEnter={() => {
          if (highlighted) onDismissHighlight?.();
        }}
        aria-label={ariaLabel}
        aria-expanded={hintOpen && !canCommit}
        aria-disabled={!canCommit || disabled}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LineItemCommitCheckButton;

export const PART_DRAFT_HINT_DEFAULT = 'Select item and quantity to add';
export const PART_DRAFT_HINT_REPLACE =
  'Select item, quantity, and part being replaced';

export function partDraftHintText(isReplace: boolean): string {
  return isReplace ? PART_DRAFT_HINT_REPLACE : PART_DRAFT_HINT_DEFAULT;
}
