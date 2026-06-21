import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Status } from '@/types/status';

export interface OrderStatusMultiFilterProps {
  options: Status[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
  triggerClassName?: string;
  allLabel?: string;
}

const OrderStatusMultiFilter: React.FC<OrderStatusMultiFilterProps> = ({
  options,
  selectedIds,
  onChange,
  className,
  triggerClassName,
  allLabel = 'All statuses',
}) => {
  const selectedSet = new Set(selectedIds);
  const selectedNames = options
    .filter((s) => selectedSet.has(String(s.id)))
    .map((s) => s.name);

  const label =
    selectedNames.length === 0
      ? allLabel
      : selectedNames.length === 1
        ? selectedNames[0]
        : `${selectedNames.length} statuses`;

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id]);
      return;
    }
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 justify-between border-border bg-background px-3 text-sm font-normal',
            triggerClassName
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-52 p-2', className)} align="start">
        <div className="space-y-1">
          {options.map((status) => {
            const id = String(status.id);
            return (
              <label
                key={status.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                <Checkbox
                  checked={selectedSet.has(id)}
                  onCheckedChange={(checked) => toggle(id, checked === true)}
                />
                <span>{status.name}</span>
              </label>
            );
          })}
        </div>
        {selectedIds.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-8 w-full text-muted-foreground"
            onClick={() => onChange([])}
          >
            Clear status filter
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default OrderStatusMultiFilter;
