import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { helpTicketsApi } from '@/features/helpTickets/helpTicketsApi';
import type { Discussion, DiscussionListResponse, CreateDiscussion } from '@/types/discussion';
import type { AppDispatch } from '@/app/store';

interface GetDiscussionsParams {
  entity_type: string;
  entity_id: number;
  skip?: number;
  limit?: number;
}

export const discussionsApi = createApi({
  reducerPath: 'discussionsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Discussion', 'Notification'],
  endpoints: (builder) => ({
    getDiscussions: builder.query<DiscussionListResponse, GetDiscussionsParams>({
      query: ({ entity_type, entity_id, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams({
          entity_type,
          entity_id: String(entity_id),
          skip: String(skip),
          limit: String(limit),
        });
        return `discussions/?${params}`;
      },
      providesTags: (_r, _e, { entity_type, entity_id }) => [
        { type: 'Discussion', id: `${entity_type}_${entity_id}` },
      ],
    }),

    createDiscussion: builder.mutation<Discussion, CreateDiscussion>({
      query: (body) => ({ url: 'discussions/', method: 'POST', body }),
      invalidatesTags: (_r, _e, { entity_type, entity_id }) => [
        { type: 'Discussion', id: `${entity_type}_${entity_id}` },
        'Notification',
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          if (arg.entity_type === 'support_ticket') {
            (dispatch as AppDispatch)(
              helpTicketsApi.util.invalidateTags([
                { type: 'HelpTicketEvents', id: arg.entity_id },
              ]),
            );
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const { useGetDiscussionsQuery, useCreateDiscussionMutation } = discussionsApi;
