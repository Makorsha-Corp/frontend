import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, ListDepartmentsParams } from '@/types/department';

export const departmentsApi = createApi({
  reducerPath: 'departmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Department'],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], ListDepartmentsParams>({
      query: ({ skip = 0, limit = 100, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (search) {
          params.append('search', search);
        }
        return `departments/?${params.toString()}`;
      },
      providesTags: ['Department'],
    }),
    getDepartmentById: builder.query<Department, number>({
      query: (id) => `departments/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Department', id }],
    }),
    createDepartment: builder.mutation<Department, CreateDepartmentRequest>({
      query: (body) => ({
        url: 'departments/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<Department, { id: number; data: UpdateDepartmentRequest }>({
      query: ({ id, data }) => ({
        url: `departments/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }, 'Department'],
    }),
    deleteDepartment: builder.mutation<Department, number>({
      query: (id) => ({
        url: `departments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
