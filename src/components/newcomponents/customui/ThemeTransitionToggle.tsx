import React from 'react';
import { Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { getNextTransitionMode, getTransitionModeLabel } from '@/lib/themeTransition';
import { Button } from '@/components/ui/button';

type ThemeTransitionToggleVariant = 'sidebar' | 'inline';

interface ThemeTransitionToggleProps {
  variant?: ThemeTransitionToggleVariant;
  className?: string;
}

const ThemeTransitionToggle: React.FC<ThemeTransitionToggleProps> = ({
  variant = 'sidebar',
  className,
}) => {
  const { transitionMode, cycleTransitionMode } = useTheme();
  const nextMode = getNextTransitionMode(transitionMode);
  const label = getTransitionModeLabel(transitionMode);
  const nextLabel = getTransitionModeLabel(nextMode);
  const title = `Theme transition: ${label}. Click to switch to ${nextLabel.toLowerCase()}.`;
  const Icon = transitionMode === 'wipe' ? Circle : Sparkles;

  if (variant === 'inline') {
    return (
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={cycleTransitionMode}
        className={cn('h-9 w-9 shrink-0 rounded-full border-border bg-card', className)}
        title={title}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycleTransitionMode}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all',
        'text-white/70 hover:bg-white/10 hover:text-white',
        className
      )}
      title={title}
    >
      <Icon size={20} className="shrink-0" />
    </button>
  );
};

export default ThemeTransitionToggle;
