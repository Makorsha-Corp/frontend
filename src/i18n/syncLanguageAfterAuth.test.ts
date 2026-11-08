// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { syncLanguageAfterAuth } from '@/i18n/syncLanguageAfterAuth';
import type { User } from '@/types/auth';
import { writeStoredUiLanguage } from '@/i18n/uiLanguage';

vi.mock('@/i18n', () => ({
  setUiLanguage: vi.fn(async () => undefined),
}));

const baseUser: User = {
  id: 1,
  email: 'a@b.com',
  name: 'Test',
  ui_language: 'en',
};

describe('syncLanguageAfterAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    writeStoredUiLanguage('en');
  });

  it('requests PATCH when local bn differs from account en', async () => {
    writeStoredUiLanguage('bn');
    const result = await syncLanguageAfterAuth(baseUser);
    expect(result.shouldPatchAccount).toBe(true);
    expect(result.patchLanguage).toBe('bn');
    expect(result.user.ui_language).toBe('bn');
  });

  it('does not PATCH when languages match', async () => {
    const result = await syncLanguageAfterAuth({ ...baseUser, ui_language: 'en' });
    expect(result.shouldPatchAccount).toBe(false);
    expect(result.user.ui_language).toBe('en');
  });
});
