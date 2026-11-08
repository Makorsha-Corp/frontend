import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  appShellHeaderBoxedControlClass,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import {
  allProductionLineIds,
  isAllProductionLinesSelected,
  isProductionRunsLineFilterDefault,
  productionRunsLineFilterLabel,
} from '@/components/newcomponents/customui/production/productionRunsLineFilterUtils';
import type { ProductionLine } from '@/types/production';
import { productionFilterCopy } from '@/components/newcomponents/customui/production/productionStatusLabel';
import { cn } from '@/lib/utils';

export interface ProductionRunsLineFilterProps {
  lines: ProductionLine[];
  selectedLineIds: number[];
  onSelectedLineIdsChange: (lineIds: number[]) => void;
  className?: string;
}

export { productionRunsLineFilterLabel } from '@/components/newcomponents/customui/production/productionRunsLineFilterUtils';

const ProductionRunsLineFilter: React.FC<ProductionRunsLineFilterProps> = ({
  lines,
  selectedLineIds,
  onSelectedLineIdsChange,
  className,
}) => {
  const { t } = useTranslation('production');
  const copy = useMemo(() => productionFilterCopy(t), [t]);
  const [open, setOpen] = useState(false);
  const [draftLineIds, setDraftLineIds] = useState<number[]>(selectedLineIds);

  useEffect(() => {
    if (!open) return;
    setDraftLineIds(selectedLineIds);
  }, [open, selectedLineIds]);

  const displayLine = useMemo(
    () => productionRunsLineFilterLabel(lines, selectedLineIds, copy),
    [lines, selectedLineIds, copy],
  );
  const showClear = !isProductionRunsLineFilterDefault(selectedLineIds, lines);
  const allLineIds = useMemo(() => allProductionLineIds(lines), [lines]);

  const toggleDraftLine = (id: number) => {
    setDraftLineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const applyDraft = () => {
    onSelectedLineIdsChange(draftLineIds);
    setOpen(false);
  };

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <MachineSelectSummaryButton
            ariaLabel={
              isAllProductionLinesSelected(selectedLineIds, lines)
                ? t('filterLinesAllAria')
                : t('filterLinesCurrentAria', { label: displayLine })
            }
            selectedLine={displayLine}
            compactLabel
            className={cn(
              appShellHeaderBoxedControlClass,
              appShellHeaderControlClass,
              'mt-0 h-9 min-h-9 max-w-[min(220px,36vw)] truncate px-2.5 text-xs sm:text-sm',
            )}
          />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(18rem,94vw)] p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">{t('productionLines')}</h3>
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={applyDraft}>
              {t('apply')}
            </Button>
          </div>
          <div className="max-h-[min(16rem,50vh)] overflow-y-auto p-3">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noLinesInFactory')}</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`runs-line-${line.id}`}
                      checked={draftLineIds.includes(line.id)}
                      onCheckedChange={() => toggleDraftLine(line.id)}
                    />
                    <Label htmlFor={`runs-line-${line.id}`} className="cursor-pointer font-normal">
                      {line.name}
                    </Label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftLineIds(allLineIds)}
            >
              {t('all')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDraftLineIds([])}
            >
              {t('none')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          aria-label={t('resetLinesAria')}
          onClick={() => onSelectedLineIdsChange(allLineIds)}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default ProductionRunsLineFilter;
