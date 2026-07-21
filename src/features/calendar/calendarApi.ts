import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { CalendarEventsParams, CalendarEventsResponse } from '@/types/calendar';

export const calendarApi = createApi({
  reducerPath: 'calendarApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CalendarEvent'],
  endpoints: (builder) => ({
    getCalendarEvents: builder.query<CalendarEventsResponse, CalendarEventsParams>({
      query: ({ start, end, types }) => {
        const params = new URLSearchParams();
        params.append('start', start);
        params.append('end', end);
        types?.forEach((type) => params.append('types', type));
        return `calendar/events?${params.toString()}`;
      },
      providesTags: ['CalendarEvent'],
    }),
  }),
});

export const { useGetCalendarEventsQuery } = calendarApi;
