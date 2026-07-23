import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  CalendarCaptionLabel,
  CalendarCaptionPickerProvider,
  CalendarMonthYearOverlay,
  type CalendarCaptionOverlay,
} from "@/components/ui/calendar-caption-picker"
import {
  calendarDayCellClass,
  calendarDayOutsideClass,
  calendarDayRangeMiddleClass,
  calendarDaySelectedClass,
  calendarDayTodayClass,
} from "@/components/ui/calendarDayClassNames"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  fromYear?: number
  toYear?: number
  /** When false, shows static month/year label without inline picker overlay. */
  enableCaptionPicker?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fromYear,
  toYear,
  enableCaptionPicker = true,
  month: monthProp,
  onMonthChange,
  defaultMonth,
  components,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  const resolvedFromYear = fromYear ?? currentYear - 10
  const resolvedToYear = toYear ?? currentYear + 10
  const isMonthControlled = monthProp !== undefined

  const [internalMonth, setInternalMonth] = React.useState(
    () => monthProp ?? defaultMonth ?? new Date(),
  )
  const [overlay, setOverlay] = React.useState<CalendarCaptionOverlay>("none")

  const displayMonth = monthProp ?? internalMonth

  React.useEffect(() => {
    if (monthProp !== undefined) {
      setInternalMonth(monthProp)
    }
  }, [monthProp])

  const handleMonthChange = React.useCallback(
    (date: Date) => {
      onMonthChange?.(date)
      if (!isMonthControlled) {
        setInternalMonth(date)
      }
      setOverlay("none")
    },
    [isMonthControlled, onMonthChange],
  )

  const openOverlay = React.useCallback(
    (mode: Exclude<CalendarCaptionOverlay, "none">) => {
      setOverlay(mode)
    },
    [],
  )

  const closeOverlay = React.useCallback(() => {
    setOverlay("none")
  }, [])

  const captionPickerContext = React.useMemo(
    () => ({
      overlay,
      openOverlay,
      closeOverlay,
      fromYear: resolvedFromYear,
      toYear: resolvedToYear,
      displayMonth,
      goToMonth: handleMonthChange,
    }),
    [
      overlay,
      openOverlay,
      closeOverlay,
      resolvedFromYear,
      resolvedToYear,
      displayMonth,
      handleMonthChange,
    ],
  )

  const shouldSyncMonth = enableCaptionPicker || isMonthControlled

  const mergedComponents = React.useMemo(
    () => ({
      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
      IconRight: () => <ChevronRight className="h-4 w-4" />,
      ...(enableCaptionPicker && !components?.CaptionLabel
        ? { CaptionLabel: CalendarCaptionLabel }
        : {}),
      ...components,
    }),
    [components, enableCaptionPicker],
  )

  return (
    <CalendarCaptionPickerProvider value={captionPickerContext}>
      <div className={cn("relative", overlay !== "none" && "overflow-hidden rounded-md")}>
        <DayPicker
          showOutsideDays={showOutsideDays}
          captionLayout="buttons"
          className={cn("p-3", className)}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: calendarDayCellClass,
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            ),
            day_range_end: "day-range-end",
            day_selected: calendarDaySelectedClass,
            day_today: calendarDayTodayClass,
            day_outside: calendarDayOutsideClass,
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: calendarDayRangeMiddleClass,
            day_hidden: "invisible",
            ...classNames,
          }}
          components={mergedComponents}
          {...(shouldSyncMonth
            ? { month: displayMonth, onMonthChange: handleMonthChange }
            : {})}
          defaultMonth={defaultMonth}
          {...props}
        />
        {enableCaptionPicker && overlay !== "none" ? (
          <CalendarMonthYearOverlay mode={overlay} />
        ) : null}
      </div>
    </CalendarCaptionPickerProvider>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
