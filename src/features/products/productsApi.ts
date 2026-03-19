import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsParams,
  ProductLedgerEntry,
  ListProductLedgerParams,
} from '../../types/product';

export const productsApi = createApi({
  reducerPath: 'productsApi',
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
  tagTypes: ['Product', 'ProductLedger'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], ListProductsParams>({
      query: ({ skip = 0, limit = 100, factory_id, is_available_for_sale } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_id) {
          params.append('factory_id', factory_id.toString());
        }
        if (is_available_for_sale !== undefined && is_available_for_sale !== null) {
          params.append('is_available_for_sale', is_available_for_sale.toString());
        }
        return `/products?${params.toString()}`;
      },
      providesTags: ['Product'],
    }),
    getProductById: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'ProductLedger'],
    }),
    updateProduct: builder.mutation<Product, { id: number; data: UpdateProductRequest }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product', 'ProductLedger'],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
    getProductLedger: builder.query<ProductLedgerEntry[], ListProductLedgerParams>({
      query: ({ skip = 0, limit = 100, factory_id, item_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_id) {
          params.append('factory_id', factory_id.toString());
        }
        if (item_id) {
          params.append('item_id', item_id.toString());
        }
        return `/products/ledger?${params.toString()}`;
      },
      providesTags: ['ProductLedger'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductLedgerQuery,
} = productsApi;
