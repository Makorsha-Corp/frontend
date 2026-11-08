import type { User } from '@/types/auth';
import { setUiLanguage } from '@/i18n';
import {
  languageForAuthenticatedSession,
  normalizeUiLanguage,
  readStoredUiLanguage,
  writeStoredUiLanguage,
} from '@/i18n/uiLanguage';

export interface SyncLanguageAfterAuthResult {
  user: User;
  shouldPatchAccount: boolean;
  patchLanguage?: 'en' | 'bn';
}

/** Align i18n + storage after login/register. Caller PATCHes when shouldPatchAccount. */
export async function syncLanguageAfterAuth(user: User): Promise<SyncLanguageAfterAuthResult> {
  const stored = readStoredUiLanguage();
  const account = languageForAuthenticatedSession(user.ui_language);

  if (stored !== account) {
    await setUiLanguage(stored);
    return {
      user: { ...user, ui_language: stored },
      shouldPatchAccount: true,
      patchLanguage: stored,
    };
  }

  writeStoredUiLanguage(account);
  await setUiLanguage(account);
  return { user: { ...user, ui_language: account }, shouldPatchAccount: false };
}

export function mergeUserUiLanguage(user: User, lang: unknown): User {
  return { ...user, ui_language: normalizeUiLanguage(lang) };
}
