import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  ProductionLine, CreateProductionLineDTO, UpdateProductionLineDTO,
  ProductionFormula, CreateProductionFormulaDTO, UpdateProductionFormulaDTO,
  ProductionFormulaItem, CreateProductionFormulaItemDTO, UpdateProductionFormulaItemDTO,
  ProductionBatch, CreateProductionBatchDTO, UpdateProductionBatchDTO,
  StartBatchDTO, CompleteBatchDTO, CancelBatchDTO,
  ProductionBatchItem, CreateProductionBatchItemDTO, UpdateProductionBatchItemDTO,
} from '@/types/production';

export interface ListProductionLinesParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  active_only?: boolean;
}

export interface ListProductionFormulasParams {
  skip?: number;
  limit?: number;
  active_only?: boolean;
}

export interface ListProductionBatchesParams {
  skip?: number;
  limit?: number;
  production_line_id?: number;
  formula_id?: number;
  status?: string;
}

export const productionApi = createApi({
  reducerPath: 'productionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (workspaceId) {
        headers.set('X-Workspace-ID', workspaceId.toString());
      }
      return headers;
    },
  }),
  tagTypes: ['ProductionLine', 'ProductionFormula', 'FormulaItem', 'ProductionBatch', 'BatchItem'],
  endpoints: (builder) => ({
    // ─── Production Lines ────────────────────────────────────────

    getProductionLines: builder.query<ProductionLine[], ListProductionLinesParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append('skip', (params.skip ?? 0).toString());
        searchParams.append('limit', (params.limit ?? 100).toString());
        if (params.factory_id) searchParams.append('factory_id', params.factory_id.toString());
        if (params.active_only) searchParams.append('active_only', 'true');
        return `/production-lines/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionLine'],
    }),
    getProductionLineById: builder.query<ProductionLine, number>({
      query: (id) => `/production-lines/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionLine', id }],
    }),
    createProductionLine: builder.mutation<ProductionLine, CreateProductionLineDTO>({
      query: (body) => ({
        url: '/production-lines/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionLine'],
    }),
    updateProductionLine: builder.mutation<ProductionLine, { id: number; data: UpdateProductionLineDTO }>({
      query: ({ id, data }) => ({
        url: `/production-lines/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionLine', id }, 'ProductionLine'],
    }),
    deleteProductionLine: builder.mutation<void, number>({
      query: (id) => ({
        url: `/production-lines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionLine'],
    }),

    // ─── Production Formulas ─────────────────────────────────────

    getProductionFormulas: builder.query<ProductionFormula[], ListProductionFormulasParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append('skip', (params.skip ?? 0).toString());
        searchParams.append('limit', (params.limit ?? 100).toString());
        if (params.active_only) searchParams.append('active_only', 'true');
        return `/production-formulas/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionFormula'],
    }),
    getProductionFormulaById: builder.query<ProductionFormula, number>({
      query: (id) => `/production-formulas/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionFormula', id }],
    }),
    createProductionFormula: builder.mutation<ProductionFormula, CreateProductionFormulaDTO>({
      query: (body) => ({
        url: '/production-formulas/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionFormula'],
    }),
    updateProductionFormula: builder.mutation<ProductionFormula, { id: number; data: UpdateProductionFormulaDTO }>({
      query: ({ id, data }) => ({
        url: `/production-formulas/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionFormula', id }, 'ProductionFormula'],
    }),
    deleteProductionFormula: builder.mutation<void, number>({
      query: (id) => ({
        url: `/production-formulas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionFormula'],
    }),

    // ─── Formula Items ───────────────────────────────────────────

    getFormulaItems: builder.query<ProductionFormulaItem[], { formulaId: number; item_role?: string }>({
      query: ({ formulaId, item_role }) => {
        const params = new URLSearchParams();
        if (item_role) params.append('item_role', item_role);
        return `/production-formulas/${formulaId}/items?${params.toString()}`;
      },
      providesTags: (result, error, { formulaId }) => [{ type: 'FormulaItem', id: `formula-${formulaId}` }],
    }),
    addFormulaItem: builder.mutation<ProductionFormulaItem, { formulaId: number; data: CreateProductionFormulaItemDTO }>({
      query: ({ formulaId, data }) => ({
        url: `/production-formulas/${formulaId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { formulaId }) => [{ type: 'FormulaItem', id: `formula-${formulaId}` }],
    }),
    updateFormulaItem: builder.mutation<ProductionFormulaItem, { id: number; data: UpdateProductionFormulaItemDTO }>({
      query: ({ id, data }) => ({
        url: `/production-formulas/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['FormulaItem'],
    }),
    removeFormulaItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/production-formulas/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FormulaItem'],
    }),

    // ─── Production Batches ──────────────────────────────────────

    getProductionBatches: builder.query<ProductionBatch[], ListProductionBatchesParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append('skip', (params.skip ?? 0).toString());
        searchParams.append('limit', (params.limit ?? 100).toString());
        if (params.production_line_id) searchParams.append('production_line_id', params.production_line_id.toString());
        if (params.formula_id) searchParams.append('formula_id', params.formula_id.toString());
        if (params.status) searchParams.append('status', params.status);
        return `/production-batches/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionBatch'],
    }),
    getProductionBatchById: builder.query<ProductionBatch, number>({
      query: (id) => `/production-batches/${id}`,
      providesTags: (result, error, id) => [{ type: 'ProductionBatch', id }],
    }),
    createProductionBatch: builder.mutation<ProductionBatch, CreateProductionBatchDTO>({
      query: (body) => ({
        url: '/production-batches/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionBatch'],
    }),
    updateProductionBatch: builder.mutation<ProductionBatch, { id: number; data: UpdateProductionBatchDTO }>({
      query: ({ id, data }) => ({
        url: `/production-batches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionBatch', id }, 'ProductionBatch'],
    }),
    deleteProductionBatch: builder.mutation<void, number>({
      query: (id) => ({
        url: `/production-batches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionBatch'],
    }),

    // ─── Batch Workflow ──────────────────────────────────────────

    startBatch: builder.mutation<ProductionBatch, { id: number; data: StartBatchDTO }>({
      query: ({ id, data }) => ({
        url: `/production-batches/${id}/start`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionBatch', id }, 'ProductionBatch', 'BatchItem'],
    }),
    completeBatch: builder.mutation<ProductionBatch, { id: number; data: CompleteBatchDTO }>({
      query: ({ id, data }) => ({
        url: `/production-batches/${id}/complete`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionBatch', id }, 'ProductionBatch', 'BatchItem'],
    }),
    cancelBatch: builder.mutation<ProductionBatch, { id: number; data: CancelBatchDTO }>({
      query: ({ id, data }) => ({
        url: `/production-batches/${id}/cancel`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProductionBatch', id }, 'ProductionBatch'],
    }),

    // ─── Batch Items ─────────────────────────────────────────────

    getBatchItems: builder.query<ProductionBatchItem[], { batchId: number; item_role?: string }>({
      query: ({ batchId, item_role }) => {
        const params = new URLSearchParams();
        if (item_role) params.append('item_role', item_role);
        return `/production-batches/${batchId}/items?${params.toString()}`;
      },
      providesTags: (result, error, { batchId }) => [{ type: 'BatchItem', id: `batch-${batchId}` }],
    }),
    addBatchItem: builder.mutation<ProductionBatchItem, { batchId: number; data: CreateProductionBatchItemDTO }>({
      query: ({ batchId, data }) => ({
        url: `/production-batches/${batchId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { batchId }) => [{ type: 'BatchItem', id: `batch-${batchId}` }],
    }),
    updateBatchItem: builder.mutation<ProductionBatchItem, { id: number; data: UpdateProductionBatchItemDTO }>({
      query: ({ id, data }) => ({
        url: `/production-batches/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['BatchItem'],
    }),
    removeBatchItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/production-batches/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BatchItem'],
    }),
  }),
});

export const {
  // Lines
  useGetProductionLinesQuery,
  useGetProductionLineByIdQuery,
  useCreateProductionLineMutation,
  useUpdateProductionLineMutation,
  useDeleteProductionLineMutation,
  // Formulas
  useGetProductionFormulasQuery,
  useGetProductionFormulaByIdQuery,
  useCreateProductionFormulaMutation,
  useUpdateProductionFormulaMutation,
  useDeleteProductionFormulaMutation,
  // Formula Items
  useGetFormulaItemsQuery,
  useAddFormulaItemMutation,
  useUpdateFormulaItemMutation,
  useRemoveFormulaItemMutation,
  // Batches
  useGetProductionBatchesQuery,
  useGetProductionBatchByIdQuery,
  useCreateProductionBatchMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  // Batch Workflow
  useStartBatchMutation,
  useCompleteBatchMutation,
  useCancelBatchMutation,
  // Batch Items
  useGetBatchItemsQuery,
  useAddBatchItemMutation,
  useUpdateBatchItemMutation,
  useRemoveBatchItemMutation,
} = productionApi;
