import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const confirmIconSizes = {
  sm: { box: 'h-5 w-5', icon: 'h-3 w-3' },
  md: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
} as const;

export function SectionConfirmIcon({
  confirmed,
  className,
  size = 'sm',
  highlighted = false,
}: {
  confirmed: boolean;
  className?: string;
  size?: keyof typeof confirmIconSizes;
  highlighted?: boolean;
}) {
  const { box, icon } = confirmIconSizes[size];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[5px] border transition-colors',
        box,
        confirmed
          ? 'border-green-600 bg-green-600 text-white shadow-sm dark:border-green-500 dark:bg-green-600'
          : 'border-border bg-muted/60 text-muted-foreground/40',
        highlighted && 'po-scroll-target-highlight',
        className
      )}
      aria-hidden
    >
      <Check className={icon} strokeWidth={2.5} />
    </span>
  );
}

export function SectionConfirmStatusBadge({
  confirmed,
  invoiceLocked = false,
  className,
  hintLabel,
  pendingLabel = 'Unconfirmed',
  confirmedLabel = 'Confirmed',
}: {
  confirmed: boolean;
  invoiceLocked?: boolean;
  className?: string;
  hintLabel?: string;
  pendingLabel?: string;
  confirmedLabel?: string;
}) {
  if (!invoiceLocked && !confirmed) {
    const badge = (
      <Badge
        variant="outline"
        className={cn('status-badge status-badge--unconfirmed', className)}
      >
        {pendingLabel}
      </Badge>
    );

    if (!hintLabel) return badge;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[14rem]">
          Click the check to confirm {hintLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (invoiceLocked || confirmed) {
    return (
      <Badge
        variant="outline"
        className={cn('status-badge status-badge--confirmed', className)}
      >
        {confirmedLabel}
      </Badge>
    );
  }

  return null;
}

interface PoSectionConfirmButtonProps {
  confirmed: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
  label: string;
  className?: string;
  variant?: 'manual' | 'system' | 'display';
  id?: string;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

const PoSectionConfirmButton: React.FC<PoSectionConfirmButtonProps> = ({
  confirmed,
  onToggle,
  isLoading = false,
  label,
  className,
  variant = 'manual',
  id,
  highlighted = false,
  onHighlightDismiss,
}) => {
  const dismissHighlightOnHover = () => {
    if (highlighted) onHighlightDismiss?.();
  };

  if (variant === 'system') {
    return (
      <span
        className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md', className)}
        title="Confirmed after invoice created"
        aria-label={`${label} confirmed after invoice created`}
        onMouseEnter={dismissHighlightOnHover}
      >
        <SectionConfirmIcon confirmed size="md" highlighted={highlighted} />
      </span>
    );
  }

  if (variant === 'display') {
    return (
      <span
        className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md', className)}
        aria-label={confirmed ? `${label} confirmed` : `${label} not confirmed`}
        onMouseEnter={dismissHighlightOnHover}
      >
        <SectionConfirmIcon confirmed={confirmed} size="md" highlighted={highlighted} />
      </span>
    );
  }

  return (
    <Button
      id={id}
      type="button"
      variant="ghost"
      size="icon"
      className={cn('group h-10 w-10 shrink-0 rounded-md hover:bg-transparent', className)}
      onClick={onToggle}
      onMouseEnter={dismissHighlightOnHover}
      disabled={isLoading || !onToggle}
      title={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-label={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-pressed={confirmed}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <SectionConfirmIcon
          confirmed={confirmed}
          size="md"
          highlighted={highlighted}
          className={!confirmed ? 'group-hover:border-muted-foreground/50 group-hover:bg-muted group-hover:text-muted-foreground/60' : undefined}
        />
      )}
    </Button>
  );
};

interface SectionConfirmActionsProps extends PoSectionConfirmButtonProps {
  invoiceLocked?: boolean;
  pendingLabel?: string;
  confirmedLabel?: string;
}

export function SectionConfirmActions({
  confirmed,
  invoiceLocked = false,
  label,
  pendingLabel,
  confirmedLabel,
  ...buttonProps
}: SectionConfirmActionsProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex shrink-0 items-center gap-2">
        <SectionConfirmStatusBadge
          confirmed={confirmed}
          invoiceLocked={invoiceLocked}
          hintLabel={label}
          pendingLabel={pendingLabel}
          confirmedLabel={confirmedLabel}
        />
        <PoSectionConfirmButton confirmed={confirmed} label={label} {...buttonProps} />
      </div>
    </TooltipProvider>
  );
}

export default PoSectionConfirmButton;
