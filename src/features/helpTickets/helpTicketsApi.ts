import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  HelpTicket,
  HelpTicketCreate,
  HelpTicketStatus,
  HelpTicketUpdate,
} from '@/types/helpTicket';

export const helpTicketsApi = createApi({
  reducerPath: 'helpTicketsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['HelpTicket', 'HelpTicketList'],
  endpoints: (builder) => ({
    listHelpTickets: builder.query<
      HelpTicket[],
      { status?: HelpTicketStatus; skip?: number; limit?: number } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.status) search.set('status', params.status);
        if (params?.skip != null) search.set('skip', String(params.skip));
        if (params?.limit != null) search.set('limit', String(params.limit));
        const qs = search.toString();
        return qs ? `help/tickets?${qs}` : 'help/tickets';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'HelpTicket' as const, id })),
              { type: 'HelpTicketList', id: 'LIST' },
            ]
          : [{ type: 'HelpTicketList', id: 'LIST' }],
    }),
    getHelpTicket: builder.query<HelpTicket, number>({
      query: (ticketId) => `help/tickets/${ticketId}`,
      providesTags: (_result, _error, ticketId) => [{ type: 'HelpTicket', id: ticketId }],
    }),
    createHelpTicket: builder.mutation<HelpTicket, HelpTicketCreate>({
      query: (body) => ({
        url: 'help/tickets',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'HelpTicketList', id: 'LIST' }],
    }),
    updateHelpTicket: builder.mutation<
      HelpTicket,
      { ticketId: number; data: HelpTicketUpdate }
    >({
      query: ({ ticketId, data }) => ({
        url: `help/tickets/${ticketId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'HelpTicket', id: ticketId },
        { type: 'HelpTicketList', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListHelpTicketsQuery,
  useGetHelpTicketQuery,
  useCreateHelpTicketMutation,
  useUpdateHelpTicketMutation,
} = helpTicketsApi;
