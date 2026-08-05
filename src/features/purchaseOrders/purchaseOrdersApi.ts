import { createApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateIncomingSummaryCache, invalidateInventoryStockCache } from '@/features/cache/invalidateInventoryStockCache';
import {
  invalidateInvoiceById,
} from '@/features/cache/invalidateOrderInvoiceCache';
import {
  purchaseOrderListCacheTags,
  purchaseOrderCacheTagsForMutation,
  PURCHASE_ORDER_LIST_TAG,
  PURCHASE_ORDER_HUB_LIST_TAG,
  PURCHASE_ORDER_HUB_STATS_TAG,
} from '@/features/cache/orderHubCacheTags';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrder,
  UpdatePurchaseOrder,
  CreatePurchaseOrderItem,
  UpdatePurchaseOrderItem,
  PurchaseOrderItemSyncRequest,
  ListPurchaseOrdersHubParams,
  PurchaseOrderListResponse,
  PurchaseOrderHubStatsResponse,
  ActiveOrderRow,
  ActiveOrdersScope,
  PurchaseOrderApprover,
  PurchaseOrderApproversList,
  PurchaseOrderEvent,
  PoReceiveEvent,
  PoReceiveEventCreate,
} from '../../types/purchaseOrder';
import type { PoItemPriceInsightsResponse } from '../../types/purchaseOrderItemInsights';

function activeOrdersQueryString(scope: ActiveOrdersScope): string {
  const params = new URLSearchParams();
  if ('machineId' in scope) params.append('machine_id', String(scope.machineId));
  if ('factoryId' in scope) params.append('factory_id', String(scope.factoryId));
  if ('projectComponentId' in scope) {
    params.append('project_component_id', String(scope.projectComponentId));
  }
  return params.toString();
}

function appendPurchaseOrderHubFilters(
  qs: URLSearchParams,
  filters: Omit<ListPurchaseOrdersHubParams, 'skip' | 'limit'>,
) {
  if (filters.account_id != null) qs.append('account_id', String(filters.account_id));
  if (filters.invoice_id != null) qs.append('invoice_id', String(filters.invoice_id));
  if (filters.date_from) qs.append('date_from', filters.date_from);
  if (filters.date_to) qs.append('date_to', filters.date_to);
  filters.status_ids?.forEach((id) => qs.append('status_ids', String(id)));
  if (filters.factory_id != null) qs.append('factory_id', String(filters.factory_id));
  if (filters.destination_type) qs.append('destination_type', filters.destination_type);
  if (filters.invoice_filter) qs.append('invoice_filter', filters.invoice_filter);
  if (filters.search) qs.append('search', filters.search);
  if (filters.exclude_complete) qs.append('exclude_complete', 'true');
  if (filters.exclude_voided) qs.append('exclude_voided', 'true');
}

function buildPurchaseOrderHubQueryString(params: ListPurchaseOrdersHubParams): string {
  const { skip = 0, limit = 50, ...filters } = params;
  const qs = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  appendPurchaseOrderHubFilters(qs, filters);
  return qs.toString();
}

function buildPurchaseOrderHubStatsQueryString(
  filters: Omit<ListPurchaseOrdersHubParams, 'skip' | 'limit'>,
): string {
  const qs = new URLSearchParams();
  appendPurchaseOrderHubFilters(qs, filters);
  return qs.toString();
}

export const purchaseOrdersApi = createApi({
  reducerPath: 'purchaseOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PurchaseOrder', 'PurchaseOrderItem', 'PurchaseOrderApprovers', 'PurchaseOrderEvents', 'ActiveOrders', 'PoReceiveEvents'],
  endpoints: (builder) => ({
    getActiveOrdersForContext: builder.query<ActiveOrderRow[], ActiveOrdersScope>({
      query: (scope) => `purchase-orders/active/?${activeOrdersQueryString(scope)}`,
      providesTags: ['ActiveOrders'],
    }),
    getPurchaseOrders: builder.query<PurchaseOrder[], ListPurchaseOrdersHubParams>({
      query: (args = {}) => `purchase-orders/?${buildPurchaseOrderHubQueryString(args)}`,
      transformResponse: (response: PurchaseOrderListResponse) => response.items,
      providesTags: [PURCHASE_ORDER_LIST_TAG],
    }),
    getPurchaseOrdersPage: builder.query<PurchaseOrderListResponse, ListPurchaseOrdersHubParams>({
      query: (args) => `purchase-orders/?${buildPurchaseOrderHubQueryString(args)}`,
      providesTags: [PURCHASE_ORDER_HUB_LIST_TAG],
    }),
    getPurchaseOrderHubStats: builder.query<
      PurchaseOrderHubStatsResponse,
      Omit<ListPurchaseOrdersHubParams, 'skip' | 'limit'>
    >({
      query: (args) => `purchase-orders/stats/?${buildPurchaseOrderHubStatsQueryString(args)}`,
      providesTags: [PURCHASE_ORDER_HUB_STATS_TAG],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrder, number>({
      query: (id) => `purchase-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrder>({
      query: (body) => ({ url: 'purchase-orders/', method: 'POST', body }),
      invalidatesTags: [...purchaseOrderListCacheTags, 'ActiveOrders', 'PurchaseOrderItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: number; data: UpdatePurchaseOrder }>({
      query: ({ id, data }) => ({ url: `purchase-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        ...purchaseOrderCacheTagsForMutation(id),
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
      ],
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchById = dispatch(
          purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, (draft) => {
            Object.assign(draft, data);
          })
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => updated)
          );
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          patchById.undo();
        }
      },
    }),
    setPurchaseOrderSectionConfirm: builder.mutation<
      PurchaseOrder,
      {
        poId: number;
        section: 'supplier' | 'details' | 'items' | 'invoice';
        confirmed: boolean;
      }
    >({
      query: ({ poId, section, confirmed }) => ({
        url: `purchase-orders/${poId}/section-confirm/`,
        method: 'PATCH',
        body: { section, confirmed },
      }),
      invalidatesTags: (_r, _e, { poId }) => [
        ...purchaseOrderCacheTagsForMutation(poId),
        { type: 'PurchaseOrderEvents', id: poId },
        { type: 'PurchaseOrderApprovers', id: poId },
      ],
      async onQueryStarted({ poId, section, confirmed }, { dispatch, queryFulfilled }) {
        const fieldMap = {
          supplier: 'supplier_confirmed',
          details: 'details_confirmed',
          items: 'items_confirmed',
          invoice: 'invoice_confirmed',
        } as const;
        const field = fieldMap[section];
        const patchById = dispatch(
          purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', poId, (draft) => {
            draft[field] = confirmed;
          })
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', poId, () => updated)
          );
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
        } catch {
          patchById.undo();
        }
      },
    }),
    deletePurchaseOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `purchase-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: [...purchaseOrderListCacheTags, 'ActiveOrders'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    createInvoiceFromPurchaseOrder: builder.mutation<PurchaseOrder, number>({
      query: (id) => ({ url: `purchase-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        ...purchaseOrderCacheTagsForMutation(id),
        'PurchaseOrderItem',
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => updated)
          );
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    markPurchaseOrderComplete: builder.mutation<PurchaseOrder, number>({
      query: (id) => ({ url: `purchase-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        ...purchaseOrderCacheTagsForMutation(id),
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => data),
          );
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    voidPurchaseOrder: builder.mutation<PurchaseOrder, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({
        url: `purchase-orders/${id}/void/`,
        method: 'POST',
        body: { void_note },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        ...purchaseOrderCacheTagsForMutation(id),
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
        { type: 'PurchaseOrderApprovers', id },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => updated)
          );
          invalidateInventoryStockCache(dispatch);
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    // Items
    getPurchaseOrderItems: builder.query<PurchaseOrderItem[], number>({
      query: (poId) => `purchase-orders/${poId}/items/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderItem', id: poId }],
    }),
    getPoItemPriceInsights: builder.query<PoItemPriceInsightsResponse, number>({
      query: (poId) => `purchase-orders/${poId}/item-price-insights/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderItem', id: poId }],
      keepUnusedDataFor: 0,
    }),
    addPurchaseOrderItem: builder.mutation<PurchaseOrderItem, { poId: number; data: CreatePurchaseOrderItem }>({
      query: ({ poId, data }) => ({ url: `purchase-orders/${poId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderItem', id: poId }, ...purchaseOrderListCacheTags, 'ActiveOrders'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    updatePurchaseOrderItem: builder.mutation<
      PurchaseOrderItem,
      { itemId: number; poId: number; data: UpdatePurchaseOrderItem }
    >({
      query: ({ itemId, data }) => ({ url: `purchase-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [
        'PurchaseOrderItem',
        ...purchaseOrderListCacheTags,
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id: poId },
      ],
      async onQueryStarted({ poId }, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          const cachedPo = purchaseOrdersApi.endpoints.getPurchaseOrderById.select(poId)(
            getState() as RootState
          )?.data;
          if (cachedPo?.invoice_id != null) {
            invalidateInvoiceById(dispatch, cachedPo.invoice_id);
          }
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    removePurchaseOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `purchase-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrderItem', ...purchaseOrderListCacheTags, 'ActiveOrders'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    syncPurchaseOrderItems: builder.mutation<
      PurchaseOrder,
      { poId: number; data: PurchaseOrderItemSyncRequest }
    >({
      query: ({ poId, data }) => ({
        url: `purchase-orders/${poId}/items/sync/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_r, _e, { poId }) => [
        { type: 'PurchaseOrderItem', id: poId },
        ...purchaseOrderCacheTagsForMutation(poId),
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id: poId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    // Approvers
    getPurchaseOrderApprovers: builder.query<PurchaseOrderApproversList, number>({
      query: (poId) => `purchase-orders/${poId}/approvers/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderApprovers', id: poId }],
    }),
    addPurchaseOrderApprover: builder.mutation<PurchaseOrderApprover, { poId: number; user_id: number }>({
      query: ({ poId, user_id }) => ({
        url: `purchase-orders/${poId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { poId }) => [
        { type: 'PurchaseOrderApprovers', id: poId },
      ],
    }),
    removePurchaseOrderApprover: builder.mutation<void, { poId: number; userId: number }>({
      query: ({ poId, userId }) => ({
        url: `purchase-orders/${poId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderApprovers', id: poId }],
    }),
    approvePurchaseOrder: builder.mutation<PurchaseOrderApprover, number>({
      query: (poId) => ({ url: `purchase-orders/${poId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, poId) => [
        { type: 'PurchaseOrderApprovers', id: poId },
        { type: 'PurchaseOrderEvents', id: poId },
        ...purchaseOrderCacheTagsForMutation(poId),
      ],
    }),
    unapprovePurchaseOrder: builder.mutation<PurchaseOrderApprover, number>({
      query: (poId) => ({ url: `purchase-orders/${poId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, poId) => [
        { type: 'PurchaseOrderApprovers', id: poId },
        { type: 'PurchaseOrderEvents', id: poId },
        ...purchaseOrderCacheTagsForMutation(poId),
      ],
    }),
    // Events
    getPurchaseOrderEvents: builder.query<PurchaseOrderEvent[], number>({
      query: (poId) => `purchase-orders/${poId}/events/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderEvents', id: poId }],
    }),
    // Receiving
    getPoReceiveEvents: builder.query<PoReceiveEvent[], number>({
      query: (poId) => `purchase-orders/${poId}/receive-events/`,
      providesTags: (_r, _e, poId) => [{ type: 'PoReceiveEvents', id: poId }],
    }),
    createPoReceiveEvent: builder.mutation<PoReceiveEvent, { poId: number; data: PoReceiveEventCreate }>({
      query: ({ poId, data }) => ({ url: `purchase-orders/${poId}/receive/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [
        { type: 'PoReceiveEvents', id: poId },
        ...purchaseOrderCacheTagsForMutation(poId),
        { type: 'PurchaseOrderEvents', id: poId },
        { type: 'PurchaseOrderItem', id: poId },
      ],
      async onQueryStarted({ poId }, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          invalidateInventoryStockCache(dispatch);
          const cachedPo = purchaseOrdersApi.endpoints.getPurchaseOrderById.select(poId)(
            getState() as RootState
          )?.data;
          if (cachedPo?.invoice_id != null) {
            invalidateInvoiceById(dispatch, cachedPo.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const {
  useGetActiveOrdersForContextQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrdersPageQuery,
  useGetPurchaseOrderHubStatsQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSetPurchaseOrderSectionConfirmMutation,
  useDeletePurchaseOrderMutation,
  useCreateInvoiceFromPurchaseOrderMutation,
  useMarkPurchaseOrderCompleteMutation,
  useVoidPurchaseOrderMutation,
  useGetPurchaseOrderItemsQuery,
  useGetPoItemPriceInsightsQuery,
  useAddPurchaseOrderItemMutation,
  useUpdatePurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
  useSyncPurchaseOrderItemsMutation,
  useGetPurchaseOrderApproversQuery,
  useAddPurchaseOrderApproverMutation,
  useRemovePurchaseOrderApproverMutation,
  useApprovePurchaseOrderMutation,
  useUnapprovePurchaseOrderMutation,
  useGetPurchaseOrderEventsQuery,
  useGetPoReceiveEventsQuery,
  useCreatePoReceiveEventMutation,
} = purchaseOrdersApi;
