import * as SwitchPrimitives from '@radix-ui/react-switch';
import { Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ShowCompleteOrdersSwitchProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  ariaLabel?: string;
}

export function ShowCompleteOrdersSwitch({
  checked,
  onCheckedChange,
  ariaLabel = 'Show complete orders',
}: ShowCompleteOrdersSwitchProps) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'data-[state=unchecked]:bg-muted data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-600',
      )}
      aria-label={ariaLabel}
    >
      <Check
        className={cn(
          'pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 stroke-[2.5]',
          'text-muted-foreground/35 transition-opacity group-data-[state=checked]:opacity-0',
        )}
        aria-hidden
      />
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        )}
      >
        <Check
          className={cn(
            'h-3 w-3 stroke-[2.5] text-emerald-600 opacity-0 transition-opacity',
            'group-data-[state=checked]:opacity-100',
          )}
          aria-hidden
        />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
}

export type ShowCompleteOrdersSwitchContext = 'list' | 'sheet';

function tooltipCopy(checked: boolean, context: ShowCompleteOrdersSwitchContext): string {
  const place = context === 'sheet' ? 'on the sheet' : 'in the list';
  return checked
    ? `Completed orders are shown ${place}. Toggle off to hide them.`
    : `Completed orders are hidden. Toggle on to show them ${place}.`;
}

export interface ShowCompleteOrdersSwitchControlProps extends ShowCompleteOrdersSwitchProps {
  context?: ShowCompleteOrdersSwitchContext;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  tooltipAlign?: 'start' | 'center' | 'end';
}

export function ShowCompleteOrdersSwitchControl({
  checked,
  onCheckedChange,
  ariaLabel = 'Show complete orders',
  context = 'list',
  tooltipSide = 'bottom',
  tooltipAlign = 'end',
}: ShowCompleteOrdersSwitchControlProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <ShowCompleteOrdersSwitch
              checked={checked}
              onCheckedChange={onCheckedChange}
              ariaLabel={ariaLabel}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={tooltipSide}
          align={tooltipAlign}
          className="max-w-[14rem] text-xs leading-snug"
        >
          {tooltipCopy(checked, context)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
