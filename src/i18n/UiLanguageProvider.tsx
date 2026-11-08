import { useEffect, type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import { setUiLanguage } from '@/i18n';
import {
  languageForAuthenticatedSession,
  normalizeUiLanguage,
  readStoredUiLanguage,
  resolveActiveUiLanguage,
  writeStoredUiLanguage,
} from '@/i18n/uiLanguage';

/**
 * Keeps i18next in sync with auth + localStorage.
 */
export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const stored = readStoredUiLanguage();
    const active = resolveActiveUiLanguage({
      accountLanguage: user?.ui_language,
      storedLanguage: stored,
      isAuthenticated,
    });

    if (isAuthenticated) {
      const account = languageForAuthenticatedSession(user?.ui_language);
      if (stored === account) {
        writeStoredUiLanguage(account);
        void setUiLanguage(account);
        return;
      }
    }

    void setUiLanguage(active);
  }, [isAuthenticated, user?.ui_language]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'makorsha.ui_language') return;
      void setUiLanguage(normalizeUiLanguage(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return <>{children}</>;
}
