import React, { useMemo } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
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
          <div className="flex items-center justify-between gap-4">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <CalendarDays className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Calendar</h1>
            </div>
            {(isLoading || isFetching) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading events" />
            )}
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <CalendarToolbar
            view={view}
            anchorDate={anchorDate}
            onViewChange={setView}
            onAnchorDateChange={setAnchorDate}
          />

          <CategoryLegendChips
            activeCategories={activeCategories}
            onToggle={toggleCategory}
            onShowAll={showAllCategories}
          />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
              Failed to load calendar events. Please try again.
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            {view === 'month' && (
              <CalendarMonthGrid days={monthDays} onSelectDay={openDayView} />
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
