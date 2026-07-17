import { cn } from '@/lib/utils';

const EMPTY_LABEL_FULL = 'No item selected — click to choose';
const EMPTY_LABEL_COMPACT = 'Click to choose';

export interface ItemSelectSummaryButtonProps {
  onClick: () => void;
  ariaLabel: string;
  /** e.g. "Bearing (pcs)" or "Bearing (pcs) · 12 on hand" */
  selectedLabel?: string | null;
  staleNumericId?: string | null;
  compactLabel?: boolean;
  className?: string;
}

const baseClassName =
  'flex min-h-10 w-full cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm select-none transition-colors hover:border-brand-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function ItemSelectSummaryButton({
  onClick,
  ariaLabel,
  selectedLabel,
  staleNumericId,
  compactLabel = false,
  className,
}: ItemSelectSummaryButtonProps) {
  const emptyLabel = compactLabel ? EMPTY_LABEL_COMPACT : EMPTY_LABEL_FULL;

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cn(baseClassName, className)}>
      {selectedLabel ? (
        <span className="line-clamp-1 text-foreground">{selectedLabel}</span>
      ) : staleNumericId ? (
        <span className="text-muted-foreground">Item ID {staleNumericId}</span>
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      )}
    </button>
  );
}
