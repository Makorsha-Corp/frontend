import React, { useMemo } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import CalendarToolbar from '@/components/newcomponents/customui/calendar/CalendarToolbar';
import CategoryLegendChips from '@/components/newcomponents/customui/calendar/CategoryLegendChips';
import CalendarMonthGrid from '@/components/newcomponents/customui/calendar/CalendarMonthGrid';
import CalendarWeekView from '@/components/newcomponents/customui/calendar/CalendarWeekView';
import CalendarDayView from '@/components/newcomponents/customui/calendar/CalendarDayView';
import CalendarAgendaList from '@/components/newcomponents/customui/calendar/CalendarAgendaList';
import { useGetCalendarEventsQuery } from '@/features/calendar/calendarApi';
import {
  buildAgendaGroups,
  buildDayCell,
  buildMonthGrid,
  buildWeekDays,
  groupEventsByDate,
} from './calendarDateUtils';
import { useCalendarFilters } from './useCalendarFilters';
import { useCalendarMonthLayoutDev } from './useCalendarMonthLayoutDev';
import CalendarMonthLayoutDevToggle from '@/components/newcomponents/customui/calendar/CalendarMonthLayoutDevToggle';

const CalendarPage: React.FC = () => {
  const {
    view,
    anchorDate,
    selectedDate,
    activeCategories,
    visibleRange,
    setView,
    setAnchorDate,
    openDayView,
    toggleCategory,
    showAllCategories,
  } = useCalendarFilters();

  const { layoutPreset, setLayoutPreset } = useCalendarMonthLayoutDev();

  const { data, isLoading, isFetching, error } = useGetCalendarEventsQuery({
    start: visibleRange.start,
    end: visibleRange.end,
    types: activeCategories,
  });

  const events = data?.events ?? [];

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const monthDays = useMemo(
    () => buildMonthGrid(anchorDate, selectedDate, eventsByDate),
    [anchorDate, selectedDate, eventsByDate],
  );

  const weekDays = useMemo(
    () => buildWeekDays(anchorDate, selectedDate, eventsByDate),
    [anchorDate, selectedDate, eventsByDate],
  );

  const dayCell = useMemo(
    () => buildDayCell(anchorDate, eventsByDate),
    [anchorDate, eventsByDate],
  );

  const agendaGroups = useMemo(
    () => buildAgendaGroups(anchorDate, eventsByDate),
    [anchorDate, eventsByDate],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader sticky>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <CalendarDays className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Calendar</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <CalendarToolbar
                variant="header"
                part="navigation"
                view={view}
                anchorDate={anchorDate}
                onViewChange={setView}
                onAnchorDateChange={setAnchorDate}
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <CalendarToolbar
                variant="header"
                part="views"
                view={view}
                anchorDate={anchorDate}
                onViewChange={setView}
                onAnchorDateChange={setAnchorDate}
              />
              {(isLoading || isFetching) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading events" />
              )}
            </div>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <CategoryLegendChips
              activeCategories={activeCategories}
              onToggle={toggleCategory}
              onShowAll={showAllCategories}
            />
            {view === 'month' ? (
              <CalendarMonthLayoutDevToggle value={layoutPreset} onChange={setLayoutPreset} />
            ) : null}
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
              Failed to load calendar events. Please try again.
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            {view === 'month' && (
              <CalendarMonthGrid
                days={monthDays}
                onSelectDay={openDayView}
                layoutPreset={layoutPreset}
              />
            )}
            {view === 'week' && (
              <CalendarWeekView days={weekDays} onSelectDay={openDayView} />
            )}
            {view === 'day' && <CalendarDayView day={dayCell} />}
            {view === 'agenda' && <CalendarAgendaList groups={agendaGroups} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
