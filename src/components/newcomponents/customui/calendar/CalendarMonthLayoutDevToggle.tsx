import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import {
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import type { MonthCellLayoutPreset } from './calendarMonthCellLayouts';

const LAYOUT_OPTIONS: { value: MonthCellLayoutPreset; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

export interface CalendarMonthLayoutDevToggleProps {
  value: MonthCellLayoutPreset;
  onChange: (preset: MonthCellLayoutPreset) => void;
}

const CalendarMonthLayoutDevToggle: React.FC<CalendarMonthLayoutDevToggleProps> = ({
  value,
  onChange,
}) => {
  return (
    <EmphasisTabsProvider value={value}>
      <Tabs value={value} onValueChange={(next) => onChange(next as MonthCellLayoutPreset)}>
        <EmphasisTabsList className="h-8 w-auto shrink-0 border border-border bg-muted/40 dark:bg-muted/60">
          {LAYOUT_OPTIONS.map((option) => (
            <EmphasisTabsTrigger
              key={option.value}
              value={option.value}
              className="flex-none px-2.5 text-xs"
            >
              {option.label}
            </EmphasisTabsTrigger>
          ))}
        </EmphasisTabsList>
      </Tabs>
    </EmphasisTabsProvider>
  );
};

export default CalendarMonthLayoutDevToggle;
