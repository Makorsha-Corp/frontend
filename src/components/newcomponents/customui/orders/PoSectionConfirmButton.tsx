import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SectionConfirmIcon({
  confirmed,
  className,
}: {
  confirmed: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
        confirmed
          ? 'border-green-600 bg-green-600 text-white shadow-sm dark:border-green-500 dark:bg-green-600'
          : 'border-border bg-muted/60 text-muted-foreground/40',
        className
      )}
      aria-hidden
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

interface PoSectionConfirmButtonProps {
  confirmed: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
  label: string;
  className?: string;
  variant?: 'manual' | 'system' | 'display';
  id?: string;
  flashing?: boolean;
  onFlashEnd?: () => void;
}

const PoSectionConfirmButton: React.FC<PoSectionConfirmButtonProps> = ({
  confirmed,
  onToggle,
  isLoading = false,
  label,
  className,
  variant = 'manual',
  id,
  flashing = false,
  onFlashEnd,
}) => {
  if (variant === 'system') {
    return (
      <span
        className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center', className)}
        title="Confirmed after invoice created"
        aria-label={`${label} confirmed after invoice created`}
      >
        <SectionConfirmIcon confirmed />
      </span>
    );
  }

  if (variant === 'display') {
    return (
      <span
        className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center', className)}
        aria-label={confirmed ? `${label} confirmed` : `${label} not confirmed`}
      >
        <SectionConfirmIcon confirmed={confirmed} />
      </span>
    );
  }

  return (
    <Button
      id={id}
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'group h-10 w-10 shrink-0 rounded-md hover:bg-transparent',
        flashing && 'po-flash-highlight-3',
        className
      )}
      onClick={onToggle}
      disabled={isLoading || !onToggle}
      title={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-label={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-pressed={confirmed}
      onAnimationEnd={(event) => {
        if (flashing && event.animationName === 'po-flash-highlight-3') {
          onFlashEnd?.();
        }
      }}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <SectionConfirmIcon
          confirmed={confirmed}
          className={!confirmed ? 'group-hover:border-muted-foreground/50 group-hover:bg-muted group-hover:text-muted-foreground/60' : undefined}
        />
      )}
    </Button>
  );
};

export default PoSectionConfirmButton;
