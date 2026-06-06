import React from 'react';
import { Check, CircleDashed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PoSectionConfirmButtonProps {
  confirmed: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
  label: string;
  className?: string;
  variant?: 'manual' | 'system' | 'display';
}

const PoSectionConfirmButton: React.FC<PoSectionConfirmButtonProps> = ({
  confirmed,
  onToggle,
  isLoading = false,
  label,
  className,
  variant = 'manual',
}) => {
  if (variant === 'system') {
    return (
      <span
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center text-green-600 dark:text-green-400',
          className
        )}
        title="Confirmed after invoice created"
        aria-label={`${label} confirmed after invoice created`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (variant === 'display') {
    return (
      <span
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center',
          confirmed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
          className
        )}
        aria-label={confirmed ? `${label} confirmed` : `${label} not confirmed`}
      >
        {confirmed ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5" />
        )}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground',
        confirmed && 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
        className
      )}
      onClick={onToggle}
      disabled={isLoading || !onToggle}
      title={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-label={confirmed ? `Unconfirm ${label}` : `Confirm ${label}`}
      aria-pressed={confirmed}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : confirmed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <CircleDashed className="h-3.5 w-3.5" />
      )}
    </Button>
  );
};

export default PoSectionConfirmButton;
