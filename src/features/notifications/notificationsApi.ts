import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  BackendNotificationListResponse,
  MarkReadRequest,
} from '@/types/notification';

interface GetNotificationsParams {
  unread_only?: boolean;
  skip?: number;
  limit?: number;
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<BackendNotificationListResponse, GetNotificationsParams>({
      query: ({ unread_only = false, skip = 0, limit = 50 } = {}) => {
        const params = new URLSearchParams({
          unread_only: String(unread_only),
          skip: String(skip),
          limit: String(limit),
        });
        return `me/notifications/?${params}`;
      },
      providesTags: ['Notification'],
    }),

    markNotificationsRead: builder.mutation<{ marked_read: number }, MarkReadRequest>({
      query: (body) => ({ url: 'me/notifications/read/', method: 'POST', body }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = notificationsApi;
