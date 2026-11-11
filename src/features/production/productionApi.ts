import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { productsApi } from '@/features/products/productsApi';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import type {
  ProductionLine, CreateProductionLineDTO, UpdateProductionLineDTO,
  ProductionFormula, CreateProductionFormulaDTO, CopyProductionFormulaDTO, UpdateProductionFormulaDTO,
  ProductionFormulaStage, CreateProductionFormulaStageDTO, UpdateProductionFormulaStageDTO,
  ProductionFormulaStageItem, CreateProductionFormulaStageItemDTO, UpdateProductionFormulaStageItemDTO,
  ProductionFormulaStageParameter, CreateProductionFormulaStageParameterDTO, UpdateProductionFormulaStageParameterDTO,
  ProductionBatchStageParameter, UpdateProductionBatchStageParameterDTO,
  ProductionBatchStageItem, UpdateProductionBatchStageItemDTO,
  ProductionBatch, CreateProductionBatchDTO, UpdateProductionBatchDTO,
  StartBatchDTO, CompleteBatchDTO, CancelBatchDTO,
  ProductionBatchItem, CreateProductionBatchItemDTO, UpdateProductionBatchItemDTO,
  ProductionBatchStageLog, CreateProductionBatchStageLogDTO, UpdateProductionBatchStageLogDTO,
  ProductionBatchEvent,
  ProductionRoute, ProductionRouteStep, ProductionScheduleBatch, StageLogScheduleMoveResponse, LinkedProductionOrder,
  ProductionBatchProgram, CreateProductionBatchProgramDTO,
  ProductionOverviewStats,
  ProductionBatchActivityStats,
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
  sales_order_item_id?: number;
}

export interface ProductionBatchStats {
  inProgressCount: number;
  totalCount: number;
}

export interface ProductionBatchStatsParams {
  factory_id?: number;
}

export interface ProductionOverviewStatsParams {
  factory_id?: number;
  production_line_id?: number;
  date_from?: string;
  date_to?: string;
  statuses?: string;
}

export interface ProductionBatchActivityParams {
  factory_id?: number;
  production_line_ids?: number[];
  formula_ids?: number[];
  statuses?: string;
}

/** By-line overview + activity heatmap (see getProductionOverviewStats / getProductionBatchActivity). */
const BATCH_OVERVIEW_STATS_TAG = 'ProductionBatchStats' as const;

function invalidateBatchRunCache(batchId: number) {
  return [
    { type: 'ProductionBatch' as const, id: batchId },
    { type: 'BatchEvent' as const, id: batchId },
    'ProductionBatch' as const,
    'ProductionSchedule' as const,
    BATCH_OVERVIEW_STATS_TAG,
  ];
}

export const productionApi = createApi({
  reducerPath: 'productionApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ProductionLine', 'ProductionFormula', 'FormulaStage', 'FormulaStageItem', 'FormulaStageParameter', 'ProductionBatch', 'BatchItem', 'BatchStageParameter', 'BatchStageItem', 'BatchStageLog', 'BatchEvent', 'ProductionBatchStats', 'ProductionRoute', 'ProductionSchedule', 'ProductionBatchProgram'],
  endpoints: (builder) => ({
    // ─── Production Lines ────────────────────────────────────────

    getProductionLines: builder.query<ProductionLine[], ListProductionLinesParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append('skip', (params.skip ?? 0).toString());
        searchParams.append('limit', (params.limit ?? 100).toString());
        if (params.factory_id) searchParams.append('factory_id', params.factory_id.toString());
        if (params.active_only) searchParams.append('active_only', 'true');
        return `production-lines/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionLine'],
    }),
    getProductionLineById: builder.query<ProductionLine, number>({
      query: (id) => `production-lines/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ProductionLine', id }],
    }),
    createProductionLine: builder.mutation<ProductionLine, CreateProductionLineDTO>({
      query: (body) => ({
        url: 'production-lines/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionLine'],
    }),
    updateProductionLine: builder.mutation<ProductionLine, { id: number; data: UpdateProductionLineDTO }>({
      query: ({ id, data }) => ({
        url: `production-lines/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'ProductionLine', id }, 'ProductionLine'],
    }),
    deleteProductionLine: builder.mutation<void, number>({
      query: (id) => ({
        url: `production-lines/${id}/`,
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
        return `production-formulas/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionFormula'],
    }),
    getProductionFormulaById: builder.query<ProductionFormula, number>({
      query: (id) => `production-formulas/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ProductionFormula', id }],
    }),
    createProductionFormula: builder.mutation<ProductionFormula, CreateProductionFormulaDTO>({
      query: (body) => ({
        url: 'production-formulas/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionFormula'],
    }),
    updateProductionFormula: builder.mutation<ProductionFormula, { id: number; data: UpdateProductionFormulaDTO }>({
      query: ({ id, data }) => ({
        url: `production-formulas/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ProductionFormula', id },
        'ProductionFormula',
        { type: 'FormulaStage', id: `formula-${id}` },
      ],
    }),
    deleteProductionFormula: builder.mutation<void, number>({
      query: (id) => ({
        url: `production-formulas/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductionFormula'],
    }),
    copyProductionFormula: builder.mutation<
      ProductionFormula,
      { sourceFormulaId: number; data: CopyProductionFormulaDTO }
    >({
      query: ({ sourceFormulaId, data }) => ({
        url: `production-formulas/${sourceFormulaId}/copy/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductionFormula', 'ProductionRoute', 'FormulaStage', 'FormulaStageItem'],
    }),

    // ─── Formula Stages ──────────────────────────────────────────

    getFormulaStages: builder.query<ProductionFormulaStage[], number>({
      query: (formulaId) => `production-formulas/${formulaId}/stages/`,
      providesTags: (_result, _error, formulaId) => [{ type: 'FormulaStage', id: `formula-${formulaId}` }],
    }),
    appendRecipeRouteStep: builder.mutation<
      ProductionFormulaStage,
      { formulaId: number; production_line_id: number; name?: string; factory_id?: number }
    >({
      query: ({ formulaId, ...body }) => ({
        url: `production-formulas/${formulaId}/route-steps/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStage', id: `formula-${formulaId}` },
        'ProductionFormula',
        'ProductionRoute',
      ],
    }),
    addFormulaStage: builder.mutation<ProductionFormulaStage, { formulaId: number; data: CreateProductionFormulaStageDTO }>({
      query: ({ formulaId, data }) => ({
        url: `production-formulas/${formulaId}/stages/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStage', id: `formula-${formulaId}` },
        'ProductionRoute',
      ],
    }),
    updateFormulaStage: builder.mutation<ProductionFormulaStage, { id: number; formulaId: number; data: UpdateProductionFormulaStageDTO }>({
      query: ({ id, data }) => ({
        url: `production-formulas/stages/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStage', id: `formula-${formulaId}` },
        'ProductionRoute',
      ],
    }),
    removeFormulaStage: builder.mutation<void, { id: number; formulaId: number }>({
      query: ({ id }) => ({
        url: `production-formulas/stages/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStage', id: `formula-${formulaId}` },
        'ProductionRoute',
      ],
    }),

    // ─── Formula stage items ───────────────────────────────────────

    getAllFormulaStageItems: builder.query<ProductionFormulaStageItem[], number>({
      query: (formulaId) => `production-formulas/${formulaId}/stage-items/`,
      providesTags: (_result, _error, formulaId) => [
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
      ],
    }),
    getFormulaStageItems: builder.query<
      ProductionFormulaStageItem[],
      { formulaId: number; stageId: number; item_role?: string }
    >({
      query: ({ formulaId, stageId, item_role }) => {
        const params = new URLSearchParams();
        if (item_role) params.append('item_role', item_role);
        const qs = params.toString();
        return qs
          ? `production-formulas/${formulaId}/stages/${stageId}/items/?${qs}`
          : `production-formulas/${formulaId}/stages/${stageId}/items/`;
      },
      providesTags: (_result, _error, { formulaId, stageId }) => [
        { type: 'FormulaStageItem', id: `stage-${stageId}` },
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
      ],
    }),
    addFormulaStageItem: builder.mutation<
      ProductionFormulaStageItem,
      { formulaId: number; stageId: number; data: CreateProductionFormulaStageItemDTO }
    >({
      query: ({ formulaId, stageId, data }) => ({
        url: `production-formulas/${formulaId}/stages/${stageId}/items/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId, stageId }) => [
        { type: 'FormulaStageItem', id: `stage-${stageId}` },
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
        { type: 'FormulaStage', id: `formula-${formulaId}` },
      ],
    }),
    ensureStageInputHandoff: builder.mutation<
      void,
      { formulaId: number; stageId: number }
    >({
      query: ({ formulaId, stageId }) => ({
        url: `production-formulas/${formulaId}/stages/${stageId}/ensure-input-handoff/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { formulaId, stageId }) => [
        { type: 'FormulaStageItem', id: `stage-${stageId}` },
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
        { type: 'FormulaStage', id: `formula-${formulaId}` },
      ],
    }),
    updateFormulaStageItem: builder.mutation<
      ProductionFormulaStageItem,
      { id: number; formulaId: number; data: UpdateProductionFormulaStageItemDTO }
    >({
      query: ({ id, data }) => ({
        url: `production-formulas/stage-items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
        'FormulaStageItem',
        { type: 'FormulaStage', id: `formula-${formulaId}` },
      ],
    }),
    removeFormulaStageItem: builder.mutation<void, { id: number; formulaId: number }>({
      query: ({ id }) => ({
        url: `production-formulas/stage-items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStageItem', id: `formula-${formulaId}` },
        'FormulaStageItem',
        { type: 'FormulaStage', id: `formula-${formulaId}` },
      ],
    }),

    getAllFormulaStageParameters: builder.query<ProductionFormulaStageParameter[], number>({
      query: (formulaId) => `production-formulas/${formulaId}/stage-parameters/`,
      providesTags: (_result, _error, formulaId) => [
        { type: 'FormulaStageParameter', id: `formula-${formulaId}` },
      ],
    }),
    getFormulaStageParameters: builder.query<
      ProductionFormulaStageParameter[],
      { formulaId: number; stageId: number }
    >({
      query: ({ formulaId, stageId }) =>
        `production-formulas/${formulaId}/stages/${stageId}/parameters/`,
      providesTags: (_result, _error, { formulaId, stageId }) => [
        { type: 'FormulaStageParameter', id: `stage-${stageId}` },
        { type: 'FormulaStageParameter', id: `formula-${formulaId}` },
      ],
    }),
    addFormulaStageParameter: builder.mutation<
      ProductionFormulaStageParameter,
      { formulaId: number; stageId: number; data: CreateProductionFormulaStageParameterDTO }
    >({
      query: ({ formulaId, stageId, data }) => ({
        url: `production-formulas/${formulaId}/stages/${stageId}/parameters/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId, stageId }) => [
        { type: 'FormulaStageParameter', id: `stage-${stageId}` },
        { type: 'FormulaStageParameter', id: `formula-${formulaId}` },
      ],
    }),
    updateFormulaStageParameter: builder.mutation<
      ProductionFormulaStageParameter,
      { id: number; formulaId: number; data: UpdateProductionFormulaStageParameterDTO }
    >({
      query: ({ id, data }) => ({
        url: `production-formulas/stage-parameters/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStageParameter', id: `formula-${formulaId}` },
        'FormulaStageParameter',
      ],
    }),
    removeFormulaStageParameter: builder.mutation<void, { id: number; formulaId: number }>({
      query: ({ id }) => ({
        url: `production-formulas/stage-parameters/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { formulaId }) => [
        { type: 'FormulaStageParameter', id: `formula-${formulaId}` },
        'FormulaStageParameter',
      ],
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
        if (params.sales_order_item_id) {
          searchParams.append('sales_order_item_id', params.sales_order_item_id.toString());
        }
        return `production-batches/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionBatch'],
    }),
    getProductionBatchStats: builder.query<ProductionBatchStats, ProductionBatchStatsParams>({
      query: ({ factory_id } = {}) => {
        const params = new URLSearchParams();
        if (factory_id != null) params.append('factory_id', factory_id.toString());
        const qs = params.toString();
        return qs ? `production-batches/stats/?${qs}` : 'production-batches/stats/';
      },
      transformResponse: (response: { in_progress_count: number; total_count: number }) => ({
        inProgressCount: response.in_progress_count,
        totalCount: response.total_count,
      }),
      providesTags: ['ProductionBatchStats'],
    }),
    getProductionOverviewStats: builder.query<ProductionOverviewStats, ProductionOverviewStatsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.factory_id != null) {
          searchParams.append('factory_id', params.factory_id.toString());
        }
        if (params.production_line_id != null) {
          searchParams.append('production_line_id', params.production_line_id.toString());
        }
        if (params.date_from) searchParams.append('date_from', params.date_from);
        if (params.date_to) searchParams.append('date_to', params.date_to);
        if (params.statuses) searchParams.append('statuses', params.statuses);
        return `production-batches/stats/overview/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionBatchStats'],
    }),
    getProductionBatchActivity: builder.query<ProductionBatchActivityStats, ProductionBatchActivityParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.factory_id != null) {
          searchParams.append('factory_id', params.factory_id.toString());
        }
        params.production_line_ids?.forEach((id) => {
          searchParams.append('production_line_id', id.toString());
        });
        params.formula_ids?.forEach((id) => {
          searchParams.append('formula_id', id.toString());
        });
        if (params.statuses) searchParams.append('statuses', params.statuses);
        return `production-batches/stats/activity/?${searchParams.toString()}`;
      },
      providesTags: ['ProductionBatchStats'],
    }),
    getProductionBatchById: builder.query<ProductionBatch, number>({
      query: (id) => `production-batches/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ProductionBatch', id }],
    }),
    getBatchEvents: builder.query<ProductionBatchEvent[], number>({
      query: (batchId) => `production-batches/${batchId}/events/`,
      providesTags: (_result, _error, batchId) => [{ type: 'BatchEvent', id: batchId }],
    }),
    createProductionBatch: builder.mutation<ProductionBatch, CreateProductionBatchDTO>({
      query: (body) => ({
        url: 'production-batches/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: 'BatchEvent', id: result.id }, 'ProductionBatch', 'ProductionSchedule', 'ProductionBatchStats']
          : ['ProductionBatch', 'ProductionSchedule', 'ProductionBatchStats'],
    }),
    updateProductionBatch: builder.mutation<ProductionBatch, { id: number; data: UpdateProductionBatchDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ProductionBatch', id },
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionSchedule',
        'ProductionBatchStats',
      ],
    }),
    deleteProductionBatch: builder.mutation<void, number>({
      query: (id) => ({
        url: `production-batches/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionSchedule',
        'ProductionBatchStats',
      ],
    }),

    // ─── Batch Workflow ──────────────────────────────────────────

    revertBatchToDraft: builder.mutation<ProductionBatch, number>({
      query: (id) => ({
        url: `production-batches/${id}/revert-to-draft/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ProductionBatch', id },
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionBatchStats',
      ],
    }),
    startBatch: builder.mutation<ProductionBatch, { id: number; data: StartBatchDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/${id}/start/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ProductionBatch', id },
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionBatchStats',
        'BatchItem',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(inventoryApi.util.invalidateTags(['Inventory']));
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),
    completeBatch: builder.mutation<ProductionBatch, { id: number; data: CompleteBatchDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/${id}/complete/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ProductionBatch', id },
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionBatchStats',
        'BatchItem',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(productsApi.util.invalidateTags(['Product', 'ProductLedger']));
          dispatch(inventoryApi.util.invalidateTags(['Inventory']));
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),
    cancelBatch: builder.mutation<ProductionBatch, { id: number; data: CancelBatchDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/${id}/cancel/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ProductionBatch', id },
        { type: 'BatchEvent', id },
        'ProductionBatch',
        'ProductionBatchStats',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(inventoryApi.util.invalidateTags(['Inventory']));
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),

    // ─── Batch Items ─────────────────────────────────────────────

    getBatchItems: builder.query<ProductionBatchItem[], { batchId: number; item_role?: string }>({
      query: ({ batchId, item_role }) => {
        const params = new URLSearchParams();
        if (item_role) params.append('item_role', item_role);
        return `production-batches/${batchId}/items/?${params.toString()}`;
      },
      providesTags: (_result, _error, { batchId }) => [{ type: 'BatchItem', id: `batch-${batchId}` }],
    }),
    addBatchItem: builder.mutation<ProductionBatchItem, { batchId: number; data: CreateProductionBatchItemDTO }>({
      query: ({ batchId, data }) => ({
        url: `production-batches/${batchId}/items/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchItem', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    updateBatchItem: builder.mutation<ProductionBatchItem, { id: number; data: UpdateProductionBatchItemDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'BatchItem', id: `batch-${result.batch_id}` },
              ...invalidateBatchRunCache(result.batch_id),
            ]
          : ['BatchItem', 'ProductionBatch', BATCH_OVERVIEW_STATS_TAG],
    }),
    removeBatchItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `production-batches/items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BatchItem', 'ProductionBatch', BATCH_OVERVIEW_STATS_TAG],
    }),

    getBatchStageParameters: builder.query<ProductionBatchStageParameter[], number>({
      query: (batchId) => `production-batches/${batchId}/stage-parameters/`,
      providesTags: (_result, _error, batchId) => [
        { type: 'BatchStageParameter', id: `batch-${batchId}` },
      ],
    }),
    updateBatchStageParameter: builder.mutation<
      ProductionBatchStageParameter,
      { id: number; batchId: number; data: UpdateProductionBatchStageParameterDTO }
    >({
      query: ({ id, data }) => ({
        url: `production-batches/stage-parameters/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageParameter', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    setBatchStageParameterBySource: builder.mutation<
      ProductionBatchStageParameter,
      {
        batchId: number;
        logId: number;
        sourceParameterId: number;
        data: UpdateProductionBatchStageParameterDTO;
      }
    >({
      query: ({ batchId, logId, sourceParameterId, data }) => ({
        url: `production-batches/${batchId}/stage-logs/${logId}/parameters/by-source/${sourceParameterId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageParameter', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),

    // ─── Batch Stage Logs ────────────────────────────────────────

    getBatchStageItems: builder.query<ProductionBatchStageItem[], number>({
      query: (batchId) => `production-batches/${batchId}/stage-items/`,
      providesTags: (_result, _error, batchId) => [
        { type: 'BatchStageItem', id: `batch-${batchId}` },
      ],
    }),
    updateBatchStageItem: builder.mutation<
      ProductionBatchStageItem,
      { id: number; batchId: number; data: UpdateProductionBatchStageItemDTO }
    >({
      query: ({ id, data }) => ({
        url: `production-batches/stage-items/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageItem', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),

    getBatchStageLogs: builder.query<ProductionBatchStageLog[], number>({
      query: (batchId) => `production-batches/${batchId}/stage-logs/`,
      providesTags: (_result, _error, batchId) => [{ type: 'BatchStageLog', id: `batch-${batchId}` }],
    }),
    addBatchStageLog: builder.mutation<ProductionBatchStageLog, { batchId: number; data: CreateProductionBatchStageLogDTO }>({
      query: ({ batchId, data }) => ({
        url: `production-batches/${batchId}/stage-logs/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageLog', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    updateBatchStageLog: builder.mutation<ProductionBatchStageLog, { id: number; batchId: number; data: UpdateProductionBatchStageLogDTO }>({
      query: ({ id, data }) => ({
        url: `production-batches/stage-logs/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageLog', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    startBatchStageLog: builder.mutation<ProductionBatchStageLog, { id: number; batchId: number; started_at?: string; machine_id?: number }>({
      query: ({ id, started_at, machine_id }) => ({
        url: `production-batches/stage-logs/${id}/start/`,
        method: 'POST',
        body: { started_at, machine_id },
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageLog', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    finishBatchStageLog: builder.mutation<ProductionBatchStageLog, { id: number; batchId: number; output_quantity: number; rework_quantity?: number; rework_to_log_id?: number; notes?: string }>({
      query: ({ id, batchId: _batchId, ...body }) => ({
        url: `production-batches/stage-logs/${id}/finish/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageLog', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    logBatchStageAsPlanned: builder.mutation<ProductionBatchStageLog, { id: number; batchId: number; output_quantity: number }>({
      query: ({ id, output_quantity }) => ({
        url: `production-batches/stage-logs/${id}/log-as-planned/`,
        method: 'POST',
        body: { output_quantity },
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: 'BatchStageLog', id: `batch-${batchId}` },
        ...invalidateBatchRunCache(batchId),
      ],
    }),
    getProductionSchedule: builder.query<
      ProductionScheduleBatch[],
      { factory_id?: number; start: string; end: string }
    >({
      query: ({ factory_id, start, end }) => {
        const params = new URLSearchParams({ start, end });
        if (factory_id != null) params.append('factory_id', String(factory_id));
        return `production-batches/schedule/?${params.toString()}`;
      },
      providesTags: ['ProductionSchedule'],
    }),
    getProductionBatchPrograms: builder.query<
      ProductionBatchProgram[],
      { factory_id?: number }
    >({
      query: ({ factory_id } = {}) => {
        const params = new URLSearchParams();
        if (factory_id != null) params.append('factory_id', String(factory_id));
        const qs = params.toString();
        return qs ? `production-batch-programs/?${qs}` : 'production-batch-programs/';
      },
      providesTags: ['ProductionBatchProgram'],
    }),
    createProductionBatchProgram: builder.mutation<ProductionBatchProgram, CreateProductionBatchProgramDTO>({
      query: (body) => ({
        url: 'production-batch-programs/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProductionSchedule', 'ProductionBatchProgram', 'ProductionBatch', 'ProductionBatchStats'],
    }),
    stopProductionBatchProgram: builder.mutation<ProductionBatchProgram, number>({
      query: (id) => ({
        url: `production-batch-programs/${id}/stop/`,
        method: 'POST',
      }),
      invalidatesTags: ['ProductionSchedule', 'ProductionBatchProgram', 'ProductionBatch', 'ProductionBatchStats'],
    }),
    moveStageLogOnSchedule: builder.mutation<
      StageLogScheduleMoveResponse,
      {
        log_id: number;
        production_line_id: number;
        planned_start_at: string;
        machine_id?: number | null;
      }
    >({
      query: ({ log_id, production_line_id, planned_start_at, machine_id }) => ({
        url: `production-batches/stage-logs/${log_id}/move-on-schedule/`,
        method: 'POST',
        body: {
          production_line_id,
          planned_start_at,
          ...(machine_id != null ? { machine_id } : {}),
        },
      }),
      invalidatesTags: ['ProductionSchedule', 'ProductionBatch'],
    }),
    getLinkedProductionOrders: builder.query<{ orders: LinkedProductionOrder[]; linked_spend_total: number | string }, number>({
      query: (batchId) => `production-batches/${batchId}/linked-orders/`,
      providesTags: (_result, _error, batchId) => [{ type: 'ProductionBatch', id: batchId }],
    }),
    getProductionRouteById: builder.query<ProductionRoute, number>({
      query: (id) => `production-routes/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ProductionRoute', id }],
    }),
    getProductionRoutes: builder.query<ProductionRoute[], { factory_id?: number } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.factory_id) search.append('factory_id', String(params.factory_id));
        const qs = search.toString();
        return `production-routes/${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['ProductionRoute'],
    }),
    getProductionRouteSteps: builder.query<ProductionRouteStep[], number>({
      query: (routeId) => `production-routes/${routeId}/steps/`,
      providesTags: (_result, _error, routeId) => [{ type: 'ProductionRoute', id: routeId }],
    }),
    createProductionRoute: builder.mutation<
      ProductionRoute,
      { factory_id: number; name: string; description?: string }
    >({
      query: (body) => ({ url: 'production-routes/', method: 'POST', body }),
      invalidatesTags: ['ProductionRoute'],
    }),
    updateProductionRoute: builder.mutation<
      ProductionRoute,
      { id: number; name?: string; description?: string; is_active?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `production-routes/${id}/`, method: 'PUT', body }),
      invalidatesTags: ['ProductionRoute'],
    }),
    deleteProductionRoute: builder.mutation<ProductionRoute, number>({
      query: (id) => ({ url: `production-routes/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ProductionRoute'],
    }),
    addProductionRouteStep: builder.mutation<
      ProductionRouteStep,
      { routeId: number; production_line_id: number; step_order: number; name?: string }
    >({
      query: ({ routeId, ...body }) => ({ url: `production-routes/${routeId}/steps/`, method: 'POST', body }),
      invalidatesTags: ['ProductionRoute', 'FormulaStage'],
    }),
    deleteProductionRouteStep: builder.mutation<ProductionRouteStep, { id: number; routeId: number }>({
      query: ({ id }) => ({ url: `production-routes/steps/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ProductionRoute', 'FormulaStage'],
    }),
    updateProductionRouteStep: builder.mutation<
      ProductionRouteStep,
      {
        id: number;
        routeId: number;
        step_order?: number;
        production_line_id?: number;
      }
    >({
      query: ({ id, routeId: _routeId, ...body }) => ({
        url: `production-routes/steps/${id}/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ProductionRoute', 'FormulaStage'],
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
  useCopyProductionFormulaMutation,
  useUpdateProductionFormulaMutation,
  useDeleteProductionFormulaMutation,
  useGetFormulaStagesQuery,
  useAddFormulaStageMutation,
  useAppendRecipeRouteStepMutation,
  useUpdateFormulaStageMutation,
  useRemoveFormulaStageMutation,
  useGetAllFormulaStageItemsQuery,
  useGetFormulaStageItemsQuery,
  useAddFormulaStageItemMutation,
  useEnsureStageInputHandoffMutation,
  useUpdateFormulaStageItemMutation,
  useRemoveFormulaStageItemMutation,
  useGetAllFormulaStageParametersQuery,
  useGetFormulaStageParametersQuery,
  useAddFormulaStageParameterMutation,
  useUpdateFormulaStageParameterMutation,
  useRemoveFormulaStageParameterMutation,
  // Batches
  useGetProductionBatchesQuery,
  useGetProductionBatchStatsQuery,
  useGetProductionOverviewStatsQuery,
  useGetProductionBatchActivityQuery,
  useGetProductionBatchByIdQuery,
  useGetBatchEventsQuery,
  useCreateProductionBatchMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  // Batch Workflow
  useStartBatchMutation,
  useCompleteBatchMutation,
  useCancelBatchMutation,
  useRevertBatchToDraftMutation,
  // Batch Items
  useGetBatchItemsQuery,
  useAddBatchItemMutation,
  useUpdateBatchItemMutation,
  useRemoveBatchItemMutation,
  useGetBatchStageItemsQuery,
  useUpdateBatchStageItemMutation,
  useGetBatchStageParametersQuery,
  useUpdateBatchStageParameterMutation,
  useSetBatchStageParameterBySourceMutation,
  useGetBatchStageLogsQuery,
  useAddBatchStageLogMutation,
  useUpdateBatchStageLogMutation,
  useStartBatchStageLogMutation,
  useFinishBatchStageLogMutation,
  useLogBatchStageAsPlannedMutation,
  useGetProductionScheduleQuery,
  useGetProductionBatchProgramsQuery,
  useCreateProductionBatchProgramMutation,
  useStopProductionBatchProgramMutation,
  useMoveStageLogOnScheduleMutation,
  useGetLinkedProductionOrdersQuery,
  useGetProductionRoutesQuery,
  useGetProductionRouteByIdQuery,
  useGetProductionRouteStepsQuery,
  useCreateProductionRouteMutation,
  useUpdateProductionRouteMutation,
  useDeleteProductionRouteMutation,
  useAddProductionRouteStepMutation,
  useDeleteProductionRouteStepMutation,
  useUpdateProductionRouteStepMutation,
} = productionApi;
