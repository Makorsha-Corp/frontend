import * as React from "react"
import {
  format,
  setMonth,
  setYear,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CaptionLabelProps } from "react-day-picker"
import { useNavigation } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarCaptionOverlay = "none" | "month" | "year"

export interface CalendarCaptionPickerContextValue {
  overlay: CalendarCaptionOverlay
  openOverlay: (mode: Exclude<CalendarCaptionOverlay, "none">) => void
  closeOverlay: () => void
  fromYear: number
  toYear: number
  displayMonth: Date
  goToMonth: (month: Date) => void
}

const CalendarCaptionPickerContext =
  React.createContext<CalendarCaptionPickerContextValue | null>(null)

export function CalendarCaptionPickerProvider({
  value,
  children,
}: {
  value: CalendarCaptionPickerContextValue
  children: React.ReactNode
}) {
  return (
    <CalendarCaptionPickerContext.Provider value={value}>
      {children}
    </CalendarCaptionPickerContext.Provider>
  )
}

function useCalendarCaptionPicker() {
  const context = React.useContext(CalendarCaptionPickerContext)
  if (!context) {
    throw new Error(
      "useCalendarCaptionPicker must be used within CalendarCaptionPickerProvider",
    )
  }
  return context
}

function captionSegmentClassName(active: boolean) {
  return cn(
    "rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors",
    active
      ? "bg-muted text-foreground"
      : "text-foreground hover:bg-muted",
  )
}

export function CalendarCaptionLabel(_props: CaptionLabelProps) {
  const { overlay, openOverlay } = useCalendarCaptionPicker()
  const { currentMonth } = useNavigation()

  return (
    <div
      className="flex items-center gap-1"
      role="presentation"
      aria-live="polite"
    >
      <button
        type="button"
        className={captionSegmentClassName(overlay === "month")}
        aria-expanded={overlay === "month"}
        aria-label={`Select month, ${format(currentMonth, "MMMM")}`}
        onClick={() => openOverlay("month")}
      >
        {format(currentMonth, "MMMM")}
      </button>
      <button
        type="button"
        className={captionSegmentClassName(overlay === "year")}
        aria-expanded={overlay === "year"}
        aria-label={`Select year, ${format(currentMonth, "yyyy")}`}
        onClick={() => openOverlay("year")}
      >
        {format(currentMonth, "yyyy")}
      </button>
    </div>
  )
}

const YEARS_PER_PAGE = 12

function monthCellClassName(selected: boolean) {
  return cn(
    buttonVariants({ variant: "ghost" }),
    "h-9 rounded-md px-2 text-sm font-normal",
    selected &&
      "bg-slate-900 text-slate-50 hover:bg-slate-900 hover:text-slate-50 focus:bg-slate-900 focus:text-slate-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50 dark:hover:text-slate-900 dark:focus:bg-slate-50 dark:focus:text-slate-900",
  )
}

export function CalendarMonthYearOverlay({
  mode,
}: {
  mode: Exclude<CalendarCaptionOverlay, "none">
}) {
  const {
    closeOverlay,
    displayMonth,
    fromYear,
    toYear,
    goToMonth,
  } = useCalendarCaptionPicker()

  const displayYear = displayMonth.getFullYear()
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const maxStart = Math.max(fromYear, toYear - YEARS_PER_PAGE + 1)
    const rawStart =
      fromYear +
      Math.floor((displayYear - fromYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE
    return Math.min(Math.max(rawStart, fromYear), maxStart)
  })

  React.useEffect(() => {
    const maxStart = Math.max(fromYear, toYear - YEARS_PER_PAGE + 1)
    const rawStart =
      fromYear +
      Math.floor((displayYear - fromYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE
    setYearPageStart(Math.min(Math.max(rawStart, fromYear), maxStart))
  }, [displayYear, fromYear, toYear, mode])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeOverlay()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [closeOverlay])

  const yearPageEnd = Math.min(yearPageStart + YEARS_PER_PAGE - 1, toYear)
  const years = React.useMemo(
    () =>
      Array.from(
        { length: yearPageEnd - yearPageStart + 1 },
        (_, index) => yearPageStart + index,
      ),
    [yearPageEnd, yearPageStart],
  )

  const canPageYearBack = yearPageStart > fromYear
  const canPageYearForward = yearPageEnd < toYear

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 animate-in fade-in-0 duration-200"
        aria-label="Close picker"
        onClick={closeOverlay}
      />
      <div
        className="relative z-10 w-full rounded-t-lg border-t border-border bg-popover p-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in-0 duration-200"
        role="dialog"
        aria-label={mode === "month" ? "Select month" : "Select year"}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-muted"
          aria-hidden
        />
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          {mode === "month" ? "Select month" : "Select year"}
        </p>
        {mode === "month" ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const monthDate = setMonth(displayMonth, monthIndex)
              const selected = displayMonth.getMonth() === monthIndex
              return (
                <button
                  key={monthIndex}
                  type="button"
                  className={monthCellClassName(selected)}
                  aria-current={selected ? "date" : undefined}
                  onClick={() => goToMonth(monthDate)}
                >
                  {format(monthDate, "MMM")}
                </button>
              )
            })}
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-7 w-7 p-0",
                  !canPageYearBack && "pointer-events-none opacity-30",
                )}
                aria-label="Previous years"
                disabled={!canPageYearBack}
                onClick={() =>
                  setYearPageStart((start) =>
                    Math.max(fromYear, start - YEARS_PER_PAGE),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                {yearPageStart}–{yearPageEnd}
              </span>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-7 w-7 p-0",
                  !canPageYearForward && "pointer-events-none opacity-30",
                )}
                aria-label="Next years"
                disabled={!canPageYearForward}
                onClick={() =>
                  setYearPageStart((start) =>
                    Math.min(
                      Math.max(fromYear, toYear - YEARS_PER_PAGE + 1),
                      start + YEARS_PER_PAGE,
                    ),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {years.map((year) => {
                const selected = displayYear === year
                return (
                  <button
                    key={year}
                    type="button"
                    className={monthCellClassName(selected)}
                    aria-current={selected ? "date" : undefined}
                    onClick={() => goToMonth(setYear(displayMonth, year))}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
