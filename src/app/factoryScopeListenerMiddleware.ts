import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppDispatch } from '@/app/store';
import { clearFactory, setFactory, setWorkspace } from '@/features/auth/authSlice';
import { invalidateFactoryScopedCache } from '@/features/cache/invalidateFactoryScopedCache';
import { resetWorkspaceApiCache } from '@/features/cache/resetWorkspaceApiCache';

export const factoryScopeListenerMiddleware = createListenerMiddleware();

factoryScopeListenerMiddleware.startListening({
  matcher: isAnyOf(setFactory, clearFactory),
  effect: (_action, listenerApi) => {
    invalidateFactoryScopedCache(listenerApi.dispatch as AppDispatch);
  },
});

factoryScopeListenerMiddleware.startListening({
  actionCreator: setWorkspace,
  effect: (_action, listenerApi) => {
    resetWorkspaceApiCache(listenerApi.dispatch as AppDispatch);
  },
});
