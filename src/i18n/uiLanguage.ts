export const UI_LANGUAGE_STORAGE_KEY = 'makorsha.ui_language';

export type UiLanguage = 'en' | 'bn';

export const UI_LANGUAGES: readonly UiLanguage[] = ['en', 'bn'] as const;

export function normalizeUiLanguage(value: unknown): UiLanguage {
  return value === 'bn' ? 'bn' : 'en';
}

export function readStoredUiLanguage(): UiLanguage {
  if (typeof localStorage === 'undefined') return 'en';
  return normalizeUiLanguage(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY));
}

export function writeStoredUiLanguage(lang: UiLanguage): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, lang);
}

const BENGALI_FONT_CLASS = 'font-bengali-ui';

let bengaliFontsLoaded = false;

async function ensureBengaliFonts(): Promise<void> {
  if (bengaliFontsLoaded) return;
  await Promise.all([
    import('@fontsource/noto-sans-bengali/400.css'),
    import('@fontsource/noto-sans-bengali/600.css'),
  ]);
  bengaliFontsLoaded = true;
}

export async function applyDocumentUiLanguage(lang: UiLanguage): Promise<void> {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  if (lang === 'bn') {
    await ensureBengaliFonts();
    document.documentElement.classList.add(BENGALI_FONT_CLASS);
  } else {
    document.documentElement.classList.remove(BENGALI_FONT_CLASS);
  }
}

export interface LanguageSyncInput {
  accountLanguage: UiLanguage | null | undefined;
  storedLanguage: UiLanguage;
  isAuthenticated: boolean;
}

/** Post-login: honor local choice if it differs from account (caller PATCHes). Pre-auth: stored only. */
export function resolveActiveUiLanguage({
  accountLanguage,
  storedLanguage,
  isAuthenticated,
}: LanguageSyncInput): UiLanguage {
  if (!isAuthenticated) return storedLanguage;
  const account = normalizeUiLanguage(accountLanguage);
  if (storedLanguage !== account) return storedLanguage;
  return account;
}

/** After successful login when account and stored match. */
export function languageForAuthenticatedSession(accountLanguage: unknown): UiLanguage {
  return normalizeUiLanguage(accountLanguage);
}
