import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { clearFactory, setFactory } from '@/features/auth/authSlice';
import { invalidateFactoryScopedCache } from '@/features/cache/invalidateFactoryScopedCache';

export const factoryScopeListenerMiddleware = createListenerMiddleware();

factoryScopeListenerMiddleware.startListening({
  matcher: isAnyOf(setFactory, clearFactory),
  effect: (_action, listenerApi) => {
    invalidateFactoryScopedCache(listenerApi.dispatch);
  },
});
