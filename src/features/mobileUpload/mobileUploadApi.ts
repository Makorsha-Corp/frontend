import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { attachmentsApi } from '@/features/attachments/attachmentsApi';
import { invalidateAttachmentEntityEventsFromLinks } from '@/features/attachments/invalidateAttachmentEntityEvents';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import type { Attachment } from '@/types/attachment';
import type {
  MobileUploadPromoteRequest,
  MobileUploadSession,
  MobileUploadSessionCreateRequest,
  MobileUploadSessionCreateResponse,
} from '@/types/mobileUpload';

export const mobileUploadApi = createApi({
  reducerPath: 'mobileUploadApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['MobileUploadSession'],
  endpoints: (builder) => ({
    createMobileUploadSession: builder.mutation<
      MobileUploadSessionCreateResponse,
      MobileUploadSessionCreateRequest
    >({
      query: (body) => ({
        url: 'mobile-upload/sessions',
        method: 'POST',
        body,
      }),
    }),
    getMobileUploadSession: builder.query<MobileUploadSession, number>({
      query: (sessionId) => `mobile-upload/sessions/${sessionId}`,
      providesTags: (_result, _error, sessionId) => [
        { type: 'MobileUploadSession', id: sessionId },
      ],
    }),
    cancelMobileUploadSession: builder.mutation<MobileUploadSession, number>({
      query: (sessionId) => ({
        url: `mobile-upload/sessions/${sessionId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, sessionId) => [
        { type: 'MobileUploadSession', id: sessionId },
      ],
    }),
    promoteMobileUploadSession: builder.mutation<
      Attachment,
      { sessionId: number } & MobileUploadPromoteRequest
    >({
      query: ({ sessionId, file_name, note }) => ({
        url: `mobile-upload/sessions/${sessionId}/promote`,
        method: 'POST',
        body: { file_name, note },
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'MobileUploadSession', id: sessionId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(attachmentsApi.util.invalidateTags(['Attachment']));
          invalidateAttachmentEntityEventsFromLinks(dispatch, data.links);
          dispatch(ledgersApi.util.invalidateTags(['Ledger']));
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const {
  useCreateMobileUploadSessionMutation,
  useGetMobileUploadSessionQuery,
  useCancelMobileUploadSessionMutation,
  usePromoteMobileUploadSessionMutation,
} = mobileUploadApi;
