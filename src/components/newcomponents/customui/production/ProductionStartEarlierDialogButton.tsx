import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductionStartEarlierFields from '@/components/newcomponents/customui/production/ProductionStartEarlierFields';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const LOG_EARLIER_START_LABEL = 'Log Earlier Start';

const LOG_EARLIER_START_TOOLTIP =
  'Step already running on the floor before you start it here? Set the real start time so duration and the activity log stay accurate.';

function formatLocalDatetimeLabel(local: string): string {
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export interface ProductionStartEarlierDialogButtonProps {
  idPrefix: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const ProductionStartEarlierDialogButton: React.FC<ProductionStartEarlierDialogButtonProps> = ({
  idPrefix,
  enabled,
  onEnabledChange,
  value,
  onChange,
  disabled,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const timeLabel = enabled ? formatLocalDatetimeLabel(value) : '';

  const buttonLabel =
    enabled && timeLabel ? `${LOG_EARLIER_START_LABEL} · ${timeLabel}` : LOG_EARLIER_START_LABEL;

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={enabled ? 'secondary' : 'outline'}
              disabled={disabled}
              className={cn('max-w-[min(100%,14rem)] truncate', className)}
              onClick={() => setOpen(true)}
            >
              {buttonLabel}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="max-w-[16rem] text-xs leading-snug">
            {LOG_EARLIER_START_TOOLTIP}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{LOG_EARLIER_START_LABEL}</DialogTitle>
            <DialogDescription>
              Record when this step actually started if it began before now.
            </DialogDescription>
          </DialogHeader>
          <ProductionStartEarlierFields
            idPrefix={idPrefix}
            enabled={enabled}
            onEnabledChange={onEnabledChange}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
          <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductionStartEarlierDialogButton;
