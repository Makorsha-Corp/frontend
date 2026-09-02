import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import {
  invalidateAttachmentEntityEventsFromLinks,
} from '@/features/attachments/invalidateAttachmentEntityEvents';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import type {
  Attachment,
  AttachmentEntityType,
  AttachmentListResponse,
  AttachmentMarkupLayer,
  AttachmentMarkupListResponse,
  AttachmentMarkupPutRequest,
  AttachmentMarkupEventListResponse,
  AttachmentPdfPageResponse,
  AttachmentSignRequest,
  AttachmentSignResponse,
} from '@/types/attachment';

export interface ListAttachmentsArgs {
  entity_type: AttachmentEntityType;
  entity_id: number;
  skip?: number;
  limit?: number;
}

export const attachmentsApi = createApi({
  reducerPath: 'attachmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Attachment', 'AttachmentMarkup', 'AttachmentMarkupEvents'],
  endpoints: (builder) => ({
    signAttachmentUpload: builder.mutation<AttachmentSignResponse, AttachmentSignRequest>({
      query: (body) => ({
        url: 'attachments/sign',
        method: 'POST',
        body,
      }),
    }),
    confirmAttachmentUpload: builder.mutation<Attachment, number>({
      query: (attachmentId) => ({
        url: `attachments/${attachmentId}/confirm`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (_result, _error, attachmentId) => [
        { type: 'Attachment', id: attachmentId },
        'Attachment',
      ],
      async onQueryStarted(_attachmentId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateAttachmentEntityEventsFromLinks(dispatch, data.links);
          dispatch(ledgersApi.util.invalidateTags(['Ledger']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    listAttachments: builder.query<AttachmentListResponse, ListAttachmentsArgs>({
      query: ({ entity_type, entity_id, skip = 0, limit = 100 }) =>
        `attachments/?entity_type=${encodeURIComponent(entity_type)}&entity_id=${entity_id}&skip=${skip}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Attachment' as const, id })),
              { type: 'Attachment', id: 'LIST' },
            ]
          : [{ type: 'Attachment', id: 'LIST' }],
    }),
    getAttachment: builder.query<Attachment, number>({
      query: (id) => `attachments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Attachment', id }],
    }),
    getAttachmentPdfPage: builder.query<
      AttachmentPdfPageResponse,
      { attachmentId: number; page: number; width?: number }
    >({
      query: ({ attachmentId, page, width }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (width != null) {
          params.set('width', String(width));
        }
        return `attachments/${attachmentId}/pdf-page?${params.toString()}`;
      },
    }),
    getAttachmentMarkups: builder.query<AttachmentMarkupListResponse, number>({
      query: (attachmentId) => `attachments/${attachmentId}/markups`,
      providesTags: (_result, _error, attachmentId) => [
        { type: 'AttachmentMarkup', id: attachmentId },
      ],
    }),
    getAttachmentMarkupEvents: builder.query<AttachmentMarkupEventListResponse, number>({
      query: (attachmentId) => `attachments/${attachmentId}/markups/events`,
      providesTags: (_result, _error, attachmentId) => [
        { type: 'AttachmentMarkupEvents', id: attachmentId },
      ],
    }),
    putMyAttachmentMarkup: builder.mutation<
      AttachmentMarkupLayer | null,
      { attachmentId: number; body: AttachmentMarkupPutRequest }
    >({
      query: ({ attachmentId, body }) => ({
        url: `attachments/${attachmentId}/markups/me`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, error, { attachmentId }) =>
        error
          ? []
          : [
              { type: 'AttachmentMarkup', id: attachmentId },
              { type: 'AttachmentMarkupEvents', id: attachmentId },
            ],
    }),
    deleteMyAttachmentMarkup: builder.mutation<void, { attachmentId: number; sessionId?: string | null }>({
      query: ({ attachmentId, sessionId }) => {
        const params = new URLSearchParams();
        if (sessionId) {
          params.set('session_id', sessionId);
        }
        const suffix = params.toString() ? `?${params.toString()}` : '';
        return {
          url: `attachments/${attachmentId}/markups/me${suffix}`,
          method: 'DELETE',
        };
      },
      invalidatesTags: (_result, error, { attachmentId }) =>
        error
          ? []
          : [
              { type: 'AttachmentMarkup', id: attachmentId },
              { type: 'AttachmentMarkupEvents', id: attachmentId },
            ],
    }),
    deleteAttachment: builder.mutation<Attachment, number>({
      query: (id) => ({
        url: `attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Attachment', id },
        { type: 'Attachment', id: 'LIST' },
      ],
      async onQueryStarted(_attachmentId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
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
  useSignAttachmentUploadMutation,
  useConfirmAttachmentUploadMutation,
  useListAttachmentsQuery,
  useGetAttachmentQuery,
  useGetAttachmentPdfPageQuery,
  useGetAttachmentMarkupsQuery,
  useGetAttachmentMarkupEventsQuery,
  usePutMyAttachmentMarkupMutation,
  useDeleteMyAttachmentMarkupMutation,
  useDeleteAttachmentMutation,
} = attachmentsApi;
