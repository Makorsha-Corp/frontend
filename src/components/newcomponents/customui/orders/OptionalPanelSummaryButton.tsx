import { cn } from '@/lib/utils';
import { ChevronUp, type LucideIcon } from 'lucide-react';

export interface OptionalPanelSummaryButtonProps {
  title: string;
  /** Shown when `isEmpty` is false. */
  summary: string;
  /** Action copy when nothing configured yet. */
  emptyLabel: string;
  isEmpty: boolean;
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  ariaLabel: string;
  className?: string;
}

const baseClassName =
  'flex h-full min-h-[3.5rem] w-full min-w-0 cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function OptionalPanelSummaryButton({
  title,
  summary,
  emptyLabel,
  isEmpty,
  open,
  onClick,
  disabled = false,
  icon: Icon,
  ariaLabel,
  className,
}: OptionalPanelSummaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn(
        baseClassName,
        open
          ? 'border-brand-primary/40 bg-brand-primary/5'
          : 'border-input bg-background hover:border-brand-primary/35 hover:bg-muted/40',
        disabled && 'cursor-not-allowed opacity-60 hover:border-input hover:bg-background',
        className,
      )}
    >
      <Icon
        className={cn('h-4 w-4 shrink-0', open ? 'text-brand-primary' : 'text-muted-foreground')}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block line-clamp-2 text-xs leading-snug text-muted-foreground">
          {isEmpty ? emptyLabel : summary}
        </span>
      </span>
      <ChevronUp
        className={cn('h-4 w-4 shrink-0', open ? 'text-brand-primary' : 'text-muted-foreground')}
        aria-hidden
      />
    </button>
  );
}
