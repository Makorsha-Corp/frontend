import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SheetWeekSection } from '@/pages/newpages/orders/workOrderSheetData';
import { busyDaysInSection } from '@/pages/newpages/orders/workOrderSheetData';

export interface WorkOrderWeekPickerOption {
  section: SheetWeekSection;
  positionLabel: string;
}

export interface WorkOrderWeekNavigatorProps {
  anchorLabel: string;
  anchorOrderCount: number;
  sheetDate: string;
  weekOptions: WorkOrderWeekPickerOption[];
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onSelectWeek: (weekStart: string) => void;
  onSheetDateChange: (iso: string) => void;
  className?: string;
}

function busyDaySummary(section: SheetWeekSection): string[] {
  return busyDaysInSection(section).map((day) => {
    const dateLabel = format(parseISO(day.date), 'EEE dd.MM');
    const countLabel = `${day.entryCount} ${day.entryCount === 1 ? 'order' : 'orders'}`;
    return `${dateLabel} · ${countLabel}`;
  });
}

const WorkOrderWeekNavigator: React.FC<WorkOrderWeekNavigatorProps> = ({
  anchorLabel,
  anchorOrderCount,
  sheetDate,
  weekOptions,
  onNavigatePrev,
  onNavigateNext,
  onSelectWeek,
  onSheetDateChange,
  className,
}) => {
  const [weekOpen, setWeekOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const parsedDate = sheetDate ? parseISO(sheetDate) : undefined;
  const anchorHint =
    anchorOrderCount > 0
      ? `${anchorOrderCount} ${anchorOrderCount === 1 ? 'order' : 'orders'}`
      : 'No orders';

  return (
    <div className={cn('inline-flex shrink-0 items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onNavigatePrev}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="inline-flex items-stretch">
        <Popover open={weekOpen} onOpenChange={setWeekOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 min-w-[10rem] rounded-r-none border-r-0 px-3 text-sm font-semibold"
            >
              <span>{anchorLabel}</span>
              <span className="ml-1 text-xs font-normal text-muted-foreground">· {anchorHint}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-[min(22rem,92vw)] p-2">
            <div className="space-y-1">
              {weekOptions.map(({ section, positionLabel: eyebrow }) => {
                const summaries = busyDaySummary(section);
                const countLabel =
                  section.orderCount > 0
                    ? `${section.orderCount} ${section.orderCount === 1 ? 'order' : 'orders'}`
                    : 'No orders';
                return (
                  <button
                    key={section.weekStart}
                    type="button"
                    onClick={() => {
                      onSelectWeek(section.weekStart);
                      setWeekOpen(false);
                    }}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/60',
                      section.isAnchor
                        ? 'border-brand-primary/40 bg-brand-primary/5'
                        : 'border-border/60 bg-background',
                    )}
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {eyebrow}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn('text-sm', section.isAnchor && 'font-semibold text-brand-primary')}
                      >
                        {section.label}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{countLabel}</span>
                    </div>
                    {summaries.length > 0 ? (
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {summaries.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-l-none px-2"
              aria-label="Pick date"
            >
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={(date) => {
                if (!date) return;
                onSheetDateChange(format(date, 'yyyy-MM-dd'));
                setCalendarOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onNavigateNext}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WorkOrderWeekNavigator;
