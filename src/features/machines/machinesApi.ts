import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from '@/app/baseQuery';

import {

  Machine,

  CreateMachineRequest,

  UpdateMachineRequest,

  ListMachinesParams,

  MachineEvent,

  CreateMachineEventRequest,

} from '../../types/machine';

import type { MachineActivityEvent, ListMachineActivityParams } from '../../types/machineActivityEvent';



export const machinesApi = createApi({

  reducerPath: 'machinesApi',

  baseQuery: baseQueryWithReauth,

  tagTypes: ['Machine', 'MachineActivity'],

  endpoints: (builder) => ({

    // ==================== MACHINE CRUD ====================

    getMachines: builder.query<Machine[], ListMachinesParams>({

      query: ({

        skip = 0,

        limit = 100,

        factory_section_id,

        is_running,

        search,

        maintenance_window,

        has_model_number,

        has_manufacturer,

        latest_event_type,

        sort_by,

        sort_dir,

      } = {}) => {

        const params = new URLSearchParams();

        params.append('skip', skip.toString());

        params.append('limit', limit.toString());

        if (factory_section_id) {

          params.append('factory_section_id', factory_section_id.toString());

        }

        if (is_running !== undefined) {

          params.append('is_running', is_running.toString());

        }

        if (search) {

          params.append('search', search);

        }

        if (maintenance_window) {

          params.append('maintenance_window', maintenance_window);

        }

        if (has_model_number !== undefined) {

          params.append('has_model_number', has_model_number.toString());

        }

        if (has_manufacturer !== undefined) {

          params.append('has_manufacturer', has_manufacturer.toString());

        }

        if (latest_event_type) {

          params.append('latest_event_type', latest_event_type);

        }

        if (sort_by) {

          params.append('sort_by', sort_by);

        }

        if (sort_dir) {

          params.append('sort_dir', sort_dir);

        }

        return `machines/?${params.toString()}`;

      },

      providesTags: ['Machine'],

    }),

    getMachineById: builder.query<Machine, number>({

      query: (id) => `machines/${id}/`,

      providesTags: (result, error, id) => [{ type: 'Machine', id }],

    }),

    createMachine: builder.mutation<Machine, CreateMachineRequest>({

      query: (body) => ({

        url: 'machines/',

        method: 'POST',

        body,

      }),

      invalidatesTags: ['Machine'],

    }),

    updateMachine: builder.mutation<Machine, { id: number; data: UpdateMachineRequest }>({

      query: ({ id, data }) => ({

        url: `machines/${id}/`,

        method: 'PUT',

        body: data,

      }),

      invalidatesTags: (result, error, { id }) => [{ type: 'Machine', id }, 'Machine', { type: 'MachineActivity', id }],

    }),

    deleteMachine: builder.mutation<Machine, number>({

      query: (id) => ({

        url: `machines/${id}/`,

        method: 'DELETE',

      }),

      invalidatesTags: ['Machine'],

    }),



    // ==================== MACHINE STATUS ====================

    createMachineEvent: builder.mutation<MachineEvent, { machine_id: number; data: CreateMachineEventRequest }>({

      query: ({ machine_id, data }) => ({

        url: `machines/${machine_id}/events/`,

        method: 'POST',

        body: data,

      }),

      invalidatesTags: (result, error, { machine_id }) => [

        { type: 'Machine', id: machine_id },

        { type: 'MachineActivity', id: machine_id },

        'Machine',

      ],

    }),

    getMachineActivityEvents: builder.query<MachineActivityEvent[], ListMachineActivityParams>({

      query: ({ machine_id, skip = 0, limit = 100 }) => {

        const params = new URLSearchParams();

        params.append('skip', skip.toString());

        params.append('limit', limit.toString());

        return `machines/${machine_id}/activity/?${params.toString()}`;

      },

      providesTags: (result, error, { machine_id }) => [

        { type: 'MachineActivity', id: machine_id },

      ],

    }),

  }),

});



export const {

  useGetMachinesQuery,

  useGetMachineByIdQuery,

  useCreateMachineMutation,

  useUpdateMachineMutation,

  useDeleteMachineMutation,

  useCreateMachineEventMutation,

  useGetMachineActivityEventsQuery,

} = machinesApi;

