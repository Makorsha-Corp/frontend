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
  isBusy?: boolean;
  onAction: () => void;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  popoverAlign?: 'start' | 'center' | 'end';
  blockedClassName?: string;
}

const BlockedActionButton: React.FC<BlockedActionButtonProps> = ({
  blocked,
  blockedHint,
  isBusy = false,
  onAction,
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isBusy || disabled) return;
    if (showBlockedHint) {
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
            if (showBlockedHint) setHintOpen(true);
          }}
          onMouseLeave={(event) => {
            onMouseLeave?.(event);
            if (showBlockedHint) setHintOpen(false);
          }}
          disabled={isBusy || (disabled && !showBlockedHint)}
          className={cn(showBlockedHint && (blockedClassName ?? 'opacity-60'), className)}
          {...buttonProps}
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
        </Button>
      </PopoverAnchor>
      {showBlockedHint && blockedHint && (
        <PopoverContent
          side={popoverSide}
          align={popoverAlign}
          className="w-72 space-y-2 p-3"
        >
          <p className="flex items-start gap-2 text-sm font-medium text-card-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {blockedHint.title}
          </p>
          <p className="text-xs text-muted-foreground">{blockedHint.reason}</p>
          {blockedHint.bullets && blockedHint.bullets.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {blockedHint.bullets.map((label) => (
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
