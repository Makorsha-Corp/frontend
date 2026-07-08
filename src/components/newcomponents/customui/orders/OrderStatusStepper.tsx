import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface OrderStatusStep {
  id: number | string;
  label: string;
  shortLabel?: string;
}

export interface OrderStatusStepperProps {
  steps: OrderStatusStep[];
  currentStepId: number | string;
  onStepClick?: (stepId: number | string) => void;
  size?: 'default' | 'compact';
  className?: string;
}

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  steps,
  currentStepId,
  onStepClick,
  size = 'default',
  className,
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const isCompact = size === 'compact';

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center relative">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!onStepClick}
                  className={cn(
                    'flex items-center justify-center rounded-full transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
                    isCompact
                      ? cn(
                          isCompleted && 'h-6 w-6 bg-brand-primary text-white',
                          isCurrent && 'h-7 w-7 bg-brand-primary text-white ring-2 ring-brand-primary/20',
                          isFuture && 'h-6 w-6 border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                        )
                      : cn(
                          isCompleted && 'h-8 w-8 bg-brand-primary text-white',
                          isCurrent && 'h-10 w-10 bg-brand-primary text-white ring-4 ring-brand-primary/20',
                          isFuture && 'h-8 w-8 border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                        ),
                    onStepClick && 'cursor-pointer hover:opacity-80',
                    !onStepClick && 'cursor-default'
                  )}
                >
                  {isCompleted ? (
                    <Check className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        'font-semibold',
                        isCompact
                          ? cn('text-[10px]', isCurrent && 'text-[11px]')
                          : cn('text-xs', isCurrent && 'text-sm')
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </button>
                <span
                  className={cn(
                    'text-center leading-tight',
                    isCompact
                      ? 'mt-1 text-[10px] max-w-[52px]'
                      : 'mt-2 text-xs max-w-[80px]',
                    isCompleted && 'text-muted-foreground',
                    isCurrent && 'font-semibold text-card-foreground',
                    isFuture && 'text-muted-foreground/60'
                  )}
                >
                  {step.shortLabel ?? step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5',
                    isCompact ? 'mx-1 -mt-4' : 'mx-2 -mt-6'
                  )}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors',
                      index < currentIndex
                        ? 'bg-brand-primary'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;
