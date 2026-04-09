import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/app/store';
import { logout } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

let sessionExpiredToastShown = false;

export const createBaseQueryWithSessionExpiry = (): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> => {
  const rawBaseQuery = fetchBaseQuery({
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
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      api.dispatch(logout());
      if (!sessionExpiredToastShown) {
        sessionExpiredToastShown = true;
        toast.error('Session expired, please login again.');
        // Allow future expired-session toasts after redirect cycle.
        setTimeout(() => {
          sessionExpiredToastShown = false;
        }, 5000);
      }
      if (typeof window !== 'undefined') {
        window.location.assign('/login2');
      }
    }

    return result;
  };
};
