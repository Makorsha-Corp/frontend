import React from 'react';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PoSectionLockButtonProps {
  locked: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
  label: string;
  className?: string;
  variant?: 'manual' | 'system';
}

const PoSectionLockButton: React.FC<PoSectionLockButtonProps> = ({
  locked,
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
        title="Locked after invoice created"
        aria-label={`${label} locked after invoice created`}
      >
        <Lock className="h-3.5 w-3.5" />
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
        locked && 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
        className
      )}
      onClick={onToggle}
      disabled={isLoading || !onToggle}
      title={locked ? `Unlock ${label}` : `Lock ${label}`}
      aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
      aria-pressed={locked}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : locked ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Unlock className="h-3.5 w-3.5" />
      )}
    </Button>
  );
};

export default PoSectionLockButton;
