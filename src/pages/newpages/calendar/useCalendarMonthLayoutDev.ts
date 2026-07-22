import { useCallback, useState } from 'react';
import {
  DEFAULT_MONTH_CELL_LAYOUT,
  type MonthCellLayoutPreset,
} from '@/components/newcomponents/customui/calendar/calendarMonthCellLayouts';

const PRESET_STORAGE_KEY = 'calendar.monthCellLayoutDev';

function readStoredPreset(): MonthCellLayoutPreset {
  if (typeof window === 'undefined') return DEFAULT_MONTH_CELL_LAYOUT;
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (raw === 'compact' || raw === 'comfortable' || raw === 'spacious') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_MONTH_CELL_LAYOUT;
}

export function useCalendarMonthLayoutDev() {
  const [layoutPreset, setLayoutPresetState] = useState<MonthCellLayoutPreset>(readStoredPreset);

  const setLayoutPreset = useCallback((preset: MonthCellLayoutPreset) => {
    setLayoutPresetState(preset);
    try {
      window.localStorage.setItem(PRESET_STORAGE_KEY, preset);
    } catch {
      /* ignore */
    }
  }, []);

  return { layoutPreset, setLayoutPreset };
}
