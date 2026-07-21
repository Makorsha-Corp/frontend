import { cn } from '@/lib/utils';

const EMPTY_LABEL_FULL = 'No machine selected — click to choose';
const EMPTY_LABEL_COMPACT = 'Click to choose';

export interface MachineSelectSummaryButtonProps {
  onClick: () => void;
  /** e.g. "Select machine" or "Change machine. Current: …" from parent */
  ariaLabel: string;
  /** After picker confirms: FAC · SEC · Name */
  selectedLine?: string | null;
  /** Edge case: ID without display line */
  staleNumericId?: string | null;
  /**
   * **`false`** (default) = full empty hint (“No machine selected — click to choose”).
   * **`true`** = shorter empty hint (“Click to choose”) for **narrow** slots (e.g. transfer grid).
   */
  compactLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

const baseClassName =
  'mt-1 flex min-h-10 w-full cursor-pointer items-center rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-sm select-none transition-colors hover:border-brand-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function MachineSelectSummaryButton({
  onClick,
  ariaLabel,
  selectedLine,
  staleNumericId,
  compactLabel = false,
  className,
  disabled = false,
}: MachineSelectSummaryButtonProps) {
  const emptyLabel = compactLabel ? EMPTY_LABEL_COMPACT : EMPTY_LABEL_FULL;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(baseClassName, 'disabled:cursor-not-allowed disabled:opacity-50', className)}
    >
      {selectedLine ? (
        <span className="text-foreground">{selectedLine}</span>
      ) : staleNumericId ? (
        <span className="text-muted-foreground">Machine ID {staleNumericId}</span>
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      )}
    </button>
  );
}
