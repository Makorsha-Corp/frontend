import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RouteFlowStep {
  id: number;
  name: string;
  unassigned?: boolean;
}

interface RouteFlowPreviewProps {
  steps: RouteFlowStep[];
  emptyMessage?: string;
  /** When set, steps render as buttons and highlight the active route step. */
  selectedStepId?: number | null;
  onStepSelect?: (step: RouteFlowStep, index: number) => void;
  size?: 'default' | 'compact';
}

export const RouteFlowPreview: React.FC<RouteFlowPreviewProps> = ({
  steps,
  emptyMessage = 'No steps on this route yet.',
  selectedStepId = null,
  onStepSelect,
  size = 'default',
}) => {
  const interactive = Boolean(onStepSelect);
  const compact = size === 'compact';

  if (steps.length === 0) {
    return (
      <p
        className={cn(
          'rounded-md border border-dashed border-border text-center text-muted-foreground',
          compact ? 'px-2 py-2 text-xs' : 'px-3 py-4 text-sm',
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  const renderStepChip = (step: RouteFlowStep, index: number) => {
    const isSelected = selectedStepId != null && step.id === selectedStepId;
    const shellClass = cn(
      'inline-flex min-w-0 items-center gap-1 rounded-md border font-medium transition-colors',
      compact ? 'max-w-[9rem] gap-0.5 px-1.5 py-0.5 text-xs' : 'max-w-[14rem] gap-1.5 px-2.5 py-1.5 text-sm',
      step.unassigned && 'border-dashed',
      isSelected ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-border bg-background',
      interactive && !isSelected && 'hover:bg-muted/40',
    );

    const label = (
      <>
        {step.unassigned ? (
          <span className="font-semibold text-muted-foreground" aria-hidden>
            X
          </span>
        ) : null}
        <span className="block min-w-0 truncate text-foreground">{step.name}</span>
      </>
    );

    if (interactive) {
      return (
        <button
          type="button"
          className={cn(
            shellClass,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          )}
          aria-pressed={isSelected}
          onClick={() => onStepSelect?.(step, index)}
        >
          {label}
        </button>
      );
    }

    return <span className={shellClass}>{label}</span>;
  };

  return (
    <div className={cn('flex flex-wrap items-center', compact ? 'gap-1' : 'gap-1.5')}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {index > 0 && (
            <ArrowRight
              className={cn('shrink-0 text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')}
              aria-hidden
            />
          )}
          {renderStepChip(step, index)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default RouteFlowPreview;
