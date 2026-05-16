import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
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
  baseQuery: baseQueryWithReauth,
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
        return `products/?${params.toString()}`;
      },
      providesTags: ['Product'],
    }),
    getProductById: builder.query<Product, number>({
      query: (id) => `products/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: 'products/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'ProductLedger'],
    }),
    updateProduct: builder.mutation<Product, { id: number; data: UpdateProductRequest }>({
      query: ({ id, data }) => ({
        url: `products/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product', 'ProductLedger'],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `products/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
    getProductLedger: builder.query<ProductLedgerEntry[], ListProductLedgerParams>({
      query: ({
        skip = 0,
        limit = 100,
        factory_id,
        item_id,
        start_date,
        end_date,
        transaction_type,
      } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_id !== undefined) params.append('factory_id', factory_id.toString());
        if (item_id !== undefined) params.append('item_id', item_id.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `products/ledger/?${params.toString()}`;
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
