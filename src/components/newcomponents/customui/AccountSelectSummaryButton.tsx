import { cn } from '@/lib/utils';

const EMPTY_LABEL_FULL = 'No account selected - click to choose';
const EMPTY_LABEL_COMPACT = 'Click to choose';

export interface AccountSelectSummaryButtonProps {
  onClick: () => void;
  ariaLabel: string;
  selectedLine?: string | null;
  staleNumericId?: string | null;
  compactLabel?: boolean;
  className?: string;
}

const baseClassName =
  'mt-1 flex min-h-10 w-full cursor-pointer items-center rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-sm select-none transition-colors hover:border-brand-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function AccountSelectSummaryButton({
  onClick,
  ariaLabel,
  selectedLine,
  staleNumericId,
  compactLabel = false,
  className,
}: AccountSelectSummaryButtonProps) {
  const emptyLabel = compactLabel ? EMPTY_LABEL_COMPACT : EMPTY_LABEL_FULL;

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cn(baseClassName, className)}>
      {selectedLine ? (
        <span className="text-foreground">{selectedLine}</span>
      ) : staleNumericId ? (
        <span className="text-muted-foreground">Account ID {staleNumericId}</span>
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      )}
    </button>
  );
}
