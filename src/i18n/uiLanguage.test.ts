// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import {
  normalizeUiLanguage,
  readStoredUiLanguage,
  resolveActiveUiLanguage,
  UI_LANGUAGE_STORAGE_KEY,
  writeStoredUiLanguage,
} from '@/i18n/uiLanguage';

describe('uiLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults stored language to en', () => {
    expect(readStoredUiLanguage()).toBe('en');
  });

  it('reads bn from localStorage when pre-auth', () => {
    writeStoredUiLanguage('bn');
    expect(readStoredUiLanguage()).toBe('bn');
    expect(
      resolveActiveUiLanguage({
        accountLanguage: 'en',
        storedLanguage: 'bn',
        isAuthenticated: false,
      }),
    ).toBe('bn');
  });

  it('uses account when stored matches after auth', () => {
    writeStoredUiLanguage('en');
    expect(
      resolveActiveUiLanguage({
        accountLanguage: 'bn',
        storedLanguage: 'en',
        isAuthenticated: true,
      }),
    ).toBe('en');
  });

  it('prefers stored when it differs from account (login PATCH intent)', () => {
    writeStoredUiLanguage('bn');
    expect(
      resolveActiveUiLanguage({
        accountLanguage: 'en',
        storedLanguage: 'bn',
        isAuthenticated: true,
      }),
    ).toBe('bn');
  });

  it('normalizeUiLanguage only allows en or bn', () => {
    expect(normalizeUiLanguage('fr')).toBe('en');
    expect(normalizeUiLanguage(null)).toBe('en');
    expect(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)).toBeNull();
  });
});
