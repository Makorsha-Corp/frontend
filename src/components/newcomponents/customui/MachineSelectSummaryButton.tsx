import * as React from 'react';
import { cn } from '@/lib/utils';

const EMPTY_LABEL_FULL = 'No machine selected — click to choose';
const EMPTY_LABEL_COMPACT = 'Click to choose';

export interface MachineSelectSummaryButtonProps {
  onClick?: () => void;
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
  /** Overrides default empty hint when nothing selected. */
  emptyLabel?: string;
  /** Second line inside button (e.g. availability for this window). */
  summaryDetail?: string | null;
  /** Keep status beside the name so the control stays one row tall. */
  summaryDetailInline?: boolean;
  summaryDetailClassName?: string;
  /** Tooltip on availability line (e.g. busy with batch). */
  summaryDetailTitle?: string;
  /** Status strip color on the left edge of the button. */
  leadingStripClassName?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const baseClassName =
  'mt-1 flex min-h-10 w-full min-w-0 max-w-full cursor-pointer items-center overflow-hidden rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-sm select-none transition-colors hover:border-brand-primary/35 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const MachineSelectSummaryButton = React.forwardRef<
  HTMLButtonElement,
  MachineSelectSummaryButtonProps
>(function MachineSelectSummaryButton(
  {
    onClick,
    ariaLabel,
    selectedLine,
    staleNumericId,
    compactLabel = false,
    emptyLabel: emptyLabelProp,
    summaryDetail,
    summaryDetailInline = false,
    summaryDetailClassName,
    summaryDetailTitle,
    leadingStripClassName,
    className,
    disabled = false,
    id,
  },
  ref,
) {
  const emptyLabel =
    emptyLabelProp ?? (compactLabel ? EMPTY_LABEL_COMPACT : EMPTY_LABEL_FULL);

  return (
    <button
      ref={ref}
      type="button"
      id={id}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        baseClassName,
        summaryDetail && !summaryDetailInline ? 'min-h-10 h-auto py-2' : null,
        leadingStripClassName ? 'relative overflow-hidden pl-3.5' : null,
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {leadingStripClassName ? (
        <span
          className={cn('absolute inset-y-0 left-0 w-1', leadingStripClassName)}
          aria-hidden
        />
      ) : null}
      {selectedLine ? (
        <span
          className={cn(
            'flex w-full min-w-0 text-left',
            summaryDetailInline ? 'items-center gap-2 overflow-hidden' : 'flex-col gap-0.5',
          )}
        >
          <span className="block min-w-0 flex-1 truncate text-foreground">{selectedLine}</span>
          {summaryDetail ? (
            <span
              className={cn(
                'truncate text-[10px] font-semibold uppercase tracking-wide',
                summaryDetailInline ? 'shrink-0' : null,
                summaryDetailClassName ?? 'text-muted-foreground',
              )}
              title={summaryDetailTitle ?? summaryDetail}
            >
              {summaryDetail}
            </span>
          ) : null}
        </span>
      ) : staleNumericId ? (
        <span className="text-muted-foreground">Machine ID {staleNumericId}</span>
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      )}
    </button>
  );
});

MachineSelectSummaryButton.displayName = 'MachineSelectSummaryButton';
