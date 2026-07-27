import React, { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface BlockedActionHint {
  title: string;
  reason: string;
  bullets?: string[];
}

export interface BlockedActionButtonProps extends ButtonProps {
  blocked: boolean;
  blockedHint?: BlockedActionHint;
  /** Shown on hover when action is allowed (e.g. icon-only controls). */
  hoverHint?: BlockedActionHint;
  isBusy?: boolean;
  onAction: () => void;
  onBlockedClick?: () => void;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  popoverAlign?: 'start' | 'center' | 'end';
  blockedClassName?: string;
}

const BlockedActionButton: React.FC<BlockedActionButtonProps> = ({
  blocked,
  blockedHint,
  hoverHint,
  isBusy = false,
  onAction,
  onBlockedClick,
  children,
  className,
  disabled,
  popoverSide = 'top',
  popoverAlign = 'end',
  blockedClassName,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...buttonProps
}) => {
  const [hintOpen, setHintOpen] = useState(false);
  const showBlockedHint = blocked && Boolean(blockedHint);
  const showHoverHint = Boolean(hoverHint) && !showBlockedHint;
  const activeHint = showBlockedHint ? blockedHint : showHoverHint ? hoverHint : undefined;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isBusy || disabled) return;
    if (showBlockedHint) {
      onBlockedClick?.();
      setHintOpen(true);
      return;
    }
    setHintOpen(false);
    onAction();
  };

  return (
    <Popover open={hintOpen} onOpenChange={setHintOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          onClick={handleClick}
          onMouseEnter={(event) => {
            onMouseEnter?.(event);
            if (activeHint) setHintOpen(true);
          }}
          onMouseLeave={(event) => {
            onMouseLeave?.(event);
            if (activeHint) setHintOpen(false);
          }}
          disabled={isBusy || (disabled && !showBlockedHint)}
          className={cn(showBlockedHint && (blockedClassName ?? 'opacity-60'), className)}
          {...buttonProps}
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
        </Button>
      </PopoverAnchor>
      {activeHint && (
        <PopoverContent
          side={popoverSide}
          align={popoverAlign}
          className="w-72 space-y-2 p-3"
        >
          <p className="flex items-start gap-2 text-sm font-medium text-card-foreground">
            {showBlockedHint ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            ) : null}
            {activeHint.title}
          </p>
          <p className="text-xs text-muted-foreground">{activeHint.reason}</p>
          {activeHint.bullets && activeHint.bullets.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {activeHint.bullets.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          )}
        </PopoverContent>
      )}
    </Popover>
  );
};

export default BlockedActionButton;
