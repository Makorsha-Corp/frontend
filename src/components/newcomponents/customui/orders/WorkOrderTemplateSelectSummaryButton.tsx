import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const EMPTY_LABEL_FULL = 'No template — click to choose';
const EMPTY_LABEL_COMPACT = 'Select...';

export interface WorkOrderTemplateSelectSummaryButtonProps {
  onClick: () => void;
  ariaLabel: string;
  selectedName?: string | null;
  compactLabel?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const baseClassName =
  'flex w-full cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background select-none transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function WorkOrderTemplateSelectSummaryButton({
  onClick,
  ariaLabel,
  selectedName,
  compactLabel = false,
  className,
  disabled = false,
  loading = false,
}: WorkOrderTemplateSelectSummaryButtonProps) {
  const emptyLabel = compactLabel ? EMPTY_LABEL_COMPACT : EMPTY_LABEL_FULL;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      className={cn(baseClassName, className)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : selectedName ? (
        <span className="line-clamp-1 text-foreground">{selectedName}</span>
      ) : (
        <span className="line-clamp-1 text-muted-foreground">{emptyLabel}</span>
      )}
    </button>
  );
}
