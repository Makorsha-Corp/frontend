/**
 * Shared RTK Query baseQuery with transparent refresh-token rotation.
 *
 * Every `createApi` slice in the codebase should set
 *   baseQuery: baseQueryWithReauth
 * so a single 401 anywhere triggers exactly one refresh, all concurrent
 * requests queue on that refresh, and the original requests are retried
 * with the new access token. If the refresh fails the user is logged out
 * and redirected to `/login?expired=1` so we never leave them stuck in a
 * silent dead-app state.
 *
 * Auth flow contract (must match backend `/auth/refresh/`):
 *   - Request body  : { refresh_token: string }
 *   - Response body : { access_token, refresh_token, token_type, expires_in, refresh_expires_in }
 *
 * Reuse detection + rotation are owned by the backend; the client just
 * needs to call POST /auth/refresh/ exactly once per refresh storm.
 */
import {
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

import type { RootState } from '@/app/store';
import { logout, setTokens } from '@/features/auth/authSlice';

const REFRESH_ENDPOINT = 'auth/refresh/';

/**
 * Returns true for endpoints that must NEVER trigger a refresh attempt.
 * - Auth endpoints themselves (login/register/refresh/logout): a 401 here is
 *   a credentials problem, not an expired access token.
 */
function isAuthEndpoint(url: string): boolean {
  // RTK Query gives us the URL relative to baseUrl; both styles handled.
  const u = url.startsWith('/') ? url.slice(1) : url;
  return (
    u.startsWith('auth/login') ||
    u.startsWith('auth/register') ||
    u.startsWith('auth/refresh') ||
    u.startsWith('auth/logout') ||
    u.startsWith('auth/forgot-password') ||
    u.startsWith('auth/reset-password')
  );
}

function urlOf(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

/**
 * Plain fetchBaseQuery: reads token + workspace from Redux every request, so
 * after a refresh the next request automatically uses the new access token.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    const workspace = state.auth.workspace;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (workspace) {
      headers.set('X-Workspace-ID', workspace.id.toString());
    }

    return headers;
  },
});

/**
 * Single global mutex so that N parallel 401s fire exactly one refresh and
 * the rest queue on it. Lives at module scope (one per app instance) — that's
 * the right scope because all `createApi` slices share this base query.
 */
const refreshMutex = new Mutex();

/**
 * Hard-fail path: clear local auth state, redirect to login with an "expired"
 * flag so the page can show a single toast. Avoids leaving the user in a half-
 * authenticated state where every request silently fails.
 */
function bailOut(api: BaseQueryApi): void {
  api.dispatch(logout());
  // Only redirect if we're not already on an auth page (avoids loops).
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (!path.startsWith('/login') && !path.startsWith('/register')) {
      window.location.href = '/login?expired=1';
    }
  }
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // If another request is mid-refresh, wait for it so we use the new token.
  await refreshMutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  // Only attempt refresh on a real 401 from a non-auth endpoint.
  if (result.error?.status !== 401) return result;
  if (isAuthEndpoint(urlOf(args))) return result;

  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;

  // No refresh token to work with — log out cleanly.
  if (!refreshToken) {
    bailOut(api);
    return result;
  }

  // First 401 wins the lock and does the actual refresh. Subsequent 401s
  // that landed concurrently will see the lock held and just wait below.
  if (!refreshMutex.isLocked()) {
    const release = await refreshMutex.acquire();
    try {
      const refreshResult = await rawBaseQuery(
        {
          url: REFRESH_ENDPOINT,
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      const data = (refreshResult.data ?? null) as {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        refresh_expires_in: number;
      } | null;

      if (data?.access_token && data?.refresh_token) {
        api.dispatch(
          setTokens({
            token: data.access_token,
            refreshToken: data.refresh_token,
          })
        );
        // Retry the original request — prepareHeaders will read the new token.
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Refresh failed (invalid/expired/reuse-detected). Bail out.
        bailOut(api);
      }
    } finally {
      release();
    }
  } else {
    // Someone else is refreshing — wait for them, then retry.
    await refreshMutex.waitForUnlock();
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
