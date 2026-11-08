import React from 'react';
import { useTranslation } from 'react-i18next';

import { SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { productionLineHasMachines } from '@/lib/productionLineMachines';
import type { ProductionLine } from '@/types/production';
import { cn } from '@/lib/utils';

type ProductionLineSelectOptionsProps = {
  lines: ProductionLine[];
  /** Current select value (line id string). Empty lines stay visible when this matches. */
  selectedLineId?: string | null;
  showIndicator?: boolean;
};

/**
 * Renders production lines inside SelectContent. Lines without machines are shown in amber
 * and cannot be chosen unless already selected on the step.
 */
export const ProductionLineSelectOptions: React.FC<ProductionLineSelectOptionsProps> = ({
  lines,
  selectedLineId = null,
  showIndicator = true,
}) => {
  const { t } = useTranslation('production');
  return (
  <>
    {lines.map((line) => {
      const value = String(line.id);
      const empty = !productionLineHasMachines(line);
      const isCurrent = selectedLineId != null && selectedLineId === value;

      if (empty && !isCurrent) {
        return (
          <Tooltip key={line.id} delayDuration={200}>
            <TooltipTrigger asChild>
              <div
                role="presentation"
                className={cn(
                  'relative flex w-full cursor-not-allowed select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm',
                  'bg-amber-500/10 text-amber-900 dark:text-amber-100',
                )}
              >
                {line.name}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-sm">
              {t('noMachinesTooltip')}
            </TooltipContent>
          </Tooltip>
        );
      }

      return (
        <SelectItem
          key={line.id}
          value={value}
          showIndicator={showIndicator}
          className={cn(empty && isCurrent && 'bg-amber-500/10 text-amber-900 dark:text-amber-100')}
        >
          {line.name}
          {empty && isCurrent ? ` (${t('noMachinesAssigned')})` : ''}
        </SelectItem>
      );
    })}
  </>
  );
};
