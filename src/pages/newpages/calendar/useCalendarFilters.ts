import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ALL_CALENDAR_CATEGORIES,
  type CalendarCategory,
  type CalendarView,
} from '@/types/calendar';
import { getVisibleRange, todayIso } from './calendarDateUtils';

function parseView(raw: string | null): CalendarView {
  if (raw === 'week' || raw === 'day' || raw === 'agenda') return raw;
  return 'month';
}

function parseCategories(raw: string | null): CalendarCategory[] {
  if (!raw) return [...ALL_CALENDAR_CATEGORIES];
  const parts = raw.split(',').filter(Boolean) as CalendarCategory[];
  const valid = parts.filter((p) => ALL_CALENDAR_CATEGORIES.includes(p));
  return valid.length > 0 ? valid : [...ALL_CALENDAR_CATEGORIES];
}

export function useCalendarFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = parseView(searchParams.get('calView'));
  const anchorDate = searchParams.get('calDate') ?? todayIso();
  const selectedDate = searchParams.get('calSelected') ?? anchorDate;
  const activeCategories = parseCategories(searchParams.get('calTypes'));

  const visibleRange = useMemo(
    () => getVisibleRange(view, anchorDate),
    [view, anchorDate],
  );

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setView = useCallback(
    (nextView: CalendarView) => patchParams({ calView: nextView }),
    [patchParams],
  );

  const setAnchorDate = useCallback(
    (date: string) => patchParams({ calDate: date }),
    [patchParams],
  );

  const setSelectedDate = useCallback(
    (date: string) => patchParams({ calSelected: date }),
    [patchParams],
  );

  const openDayView = useCallback(
    (date: string) =>
      patchParams({
        calDate: date,
        calSelected: date,
        calView: 'day',
      }),
    [patchParams],
  );

  const toggleCategory = useCallback(
    (category: CalendarCategory) => {
      const next = activeCategories.includes(category)
        ? activeCategories.filter((c) => c !== category)
        : [...activeCategories, category];
      patchParams({
        calTypes: next.length === ALL_CALENDAR_CATEGORIES.length ? null : next.join(','),
      });
    },
    [activeCategories, patchParams],
  );

  const showAllCategories = useCallback(
    () => patchParams({ calTypes: null }),
    [patchParams],
  );

  return {
    view,
    anchorDate,
    selectedDate,
    activeCategories,
    visibleRange,
    setView,
    setAnchorDate,
    setSelectedDate,
    openDayView,
    toggleCategory,
    showAllCategories,
  };
}
