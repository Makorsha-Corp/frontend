import React from 'react';
import { cn } from '@/lib/utils';
import { ALL_CALENDAR_CATEGORIES, type CalendarCategory } from '@/types/calendar';
import { CALENDAR_CATEGORY_STYLES } from './calendarCategoryStyles';

export interface CategoryLegendChipsProps {
  activeCategories: CalendarCategory[];
  onToggle: (category: CalendarCategory) => void;
  /** All on → clear all; otherwise select all. */
  onToggleAll: () => void;
  /** popover: single-line horizontal scroll. bar: legacy labeled strip with horizontal scroll. */
  variant?: 'bar' | 'popover';
}

const CategoryLegendChips: React.FC<CategoryLegendChipsProps> = ({
  activeCategories,
  onToggle,
  onToggleAll,
  variant = 'popover',
}) => {
  const allActive = activeCategories.length === ALL_CALENDAR_CATEGORIES.length;
  const noneActive = activeCategories.length === 0;
  const popover = variant === 'popover';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center',
        !popover && 'flex-col gap-2 sm:flex-row sm:gap-3',
      )}
    >
      {!popover ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">Show</span>
      ) : null}
      <div
        className={cn(
          'flex min-w-0 items-center gap-2',
          popover
            ? 'flex-nowrap overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'flex-1 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        role="group"
        aria-label="Event types"
      >
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
            allActive
              ? 'border-transparent bg-brand-primary text-primary-foreground shadow-sm'
              : noneActive
                ? 'border-transparent bg-muted/80 text-muted-foreground'
                : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
          )}
          onClick={onToggleAll}
          aria-pressed={allActive}
          aria-label={allActive ? 'Clear all types' : 'Select all types'}
        >
          All types
        </button>
        {ALL_CALENDAR_CATEGORIES.map((category) => {
          const style = CALENDAR_CATEGORY_STYLES[category];
          const active = activeCategories.includes(category);
          return (
            <button
              key={category}
              type="button"
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active ? style.chipActive : cn(style.chip, 'hover:opacity-100'),
                !active && 'opacity-75',
              )}
              onClick={() => onToggle(category)}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryLegendChips;
