import React from 'react';
import { cn } from '@/lib/utils';
import { ALL_CALENDAR_CATEGORIES, type CalendarCategory } from '@/types/calendar';
import { CALENDAR_CATEGORY_STYLES } from './calendarCategoryStyles';

export interface CategoryLegendChipsProps {
  activeCategories: CalendarCategory[];
  onToggle: (category: CalendarCategory) => void;
  onShowAll: () => void;
}

const CategoryLegendChips: React.FC<CategoryLegendChipsProps> = ({
  activeCategories,
  onToggle,
  onShowAll,
}) => {
  const allActive = activeCategories.length === ALL_CALENDAR_CATEGORIES.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={cn(
          'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
          allActive
            ? 'border-brand-primary bg-brand-primary/10 text-foreground'
            : 'border-border bg-background text-muted-foreground hover:text-foreground',
        )}
        onClick={onShowAll}
      >
        All
      </button>
      {ALL_CALENDAR_CATEGORIES.map((category) => {
        const style = CALENDAR_CATEGORY_STYLES[category];
        const active = activeCategories.includes(category);
        return (
          <button
            key={category}
            type="button"
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              active ? style.chipActive : cn(style.chip, 'opacity-50 hover:opacity-100'),
            )}
            onClick={() => onToggle(category)}
          >
            {style.label}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryLegendChips;
