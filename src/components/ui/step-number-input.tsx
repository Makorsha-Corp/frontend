import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input, type InputProps } from './input';

function decimalPlaces(step: number): number {
  const s = String(step);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function formatStepValue(value: number, step: number): string {
  const precision = decimalPlaces(step);
  if (precision === 0) return String(value);
  const fixed = value.toFixed(precision);
  return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function applyStep(
  raw: string,
  direction: 1 | -1,
  step: number,
  min?: number,
  max?: number
): string {
  const parsed = parseFloat(raw);
  const base = Number.isFinite(parsed) ? parsed : 0;
  let next = base + direction * step;
  const precision = decimalPlaces(step);
  next = Number(next.toFixed(precision));
  if (min != null) next = Math.max(min, next);
  if (max != null) next = Math.min(max, next);
  return formatStepValue(next, step);
}

function fireChange(
  el: HTMLInputElement,
  value: string,
  onChange?: React.ChangeEventHandler<HTMLInputElement>
) {
  if (!onChange) return;
  onChange({
    target: { ...el, value },
    currentTarget: { ...el, value },
  } as React.ChangeEvent<HTMLInputElement>);
}

export interface StepNumberInputProps extends Omit<InputProps, 'type' | 'step' | 'min' | 'max'> {
  step?: number;
  min?: number;
  max?: number;
}

const StepNumberInput = React.forwardRef<HTMLInputElement, StepNumberInputProps>(
  ({ step = 0.01, min, max, className, onChange, onKeyDown, onWheel, disabled, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const stepBy = React.useCallback(
      (direction: 1 | -1) => {
        const el = inputRef.current;
        if (!el || disabled) return;
        const next = applyStep(el.value, direction, step, min, max);
        fireChange(el, next, onChange);
      },
      [step, min, max, onChange, disabled]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(e.key === 'ArrowUp' ? 1 : -1);
      }
      onKeyDown?.(e);
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (document.activeElement === e.currentTarget) {
        e.preventDefault();
        stepBy(e.deltaY < 0 ? 1 : -1);
      }
      onWheel?.(e);
    };

    return (
      <div className="relative">
        <Input
          ref={setRefs}
          type="number"
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none pr-8',
            className
          )}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-7 flex-col border-l border-input">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Increase value"
            className="pointer-events-auto flex flex-1 items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            onClick={() => stepBy(1)}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Decrease value"
            className="pointer-events-auto flex flex-1 items-center justify-center border-t border-input text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            onClick={() => stepBy(-1)}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
);
StepNumberInput.displayName = 'StepNumberInput';

export { StepNumberInput };
