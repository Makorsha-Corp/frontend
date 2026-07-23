/** Shared react-day-picker day/cell classNames for Marker popover calendars. */

export const calendarDaySelectedClass =
  "!rounded-md !bg-brand-primary !text-primary-foreground hover:!bg-brand-primary/90 hover:!text-primary-foreground focus:!bg-brand-primary focus:!text-primary-foreground dark:!bg-brand-primary dark:!text-primary-foreground dark:hover:!bg-brand-primary/90"

export const calendarDayTodayClass =
  "font-semibold [&:not([aria-selected=true])]:bg-brand-primary/15 [&:not([aria-selected=true])]:text-foreground dark:[&:not([aria-selected=true])]:bg-brand-primary/20"

export const calendarDayCellClass =
  "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-muted/40 [&:has([aria-selected])]:bg-muted/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-muted/40 dark:[&:has([aria-selected])]:bg-muted/50"

export const calendarDayOutsideClass =
  "day-outside text-muted-foreground opacity-50 aria-selected:bg-muted/40 aria-selected:text-muted-foreground aria-selected:opacity-30"

export const calendarDayRangeMiddleClass =
  "aria-selected:bg-muted/30 aria-selected:text-foreground dark:aria-selected:bg-muted/50 dark:aria-selected:text-foreground"

/** Week-band highlight for Work Orders week pickers (extends base day_selected). */
export const workOrderWeekSelectedModifierClassNames = {
  selectedWeek:
    "rounded-none bg-brand-primary/10 hover:bg-brand-primary/15 aria-selected:!rounded-md aria-selected:!bg-brand-primary aria-selected:!text-primary-foreground aria-selected:hover:!bg-brand-primary/90 aria-selected:hover:!text-primary-foreground aria-selected:focus:!bg-brand-primary aria-selected:focus:!text-primary-foreground dark:aria-selected:!bg-brand-primary dark:aria-selected:!text-primary-foreground",
  selectedWeekStart: "rounded-l-md",
  selectedWeekEnd: "rounded-r-md",
} as const
